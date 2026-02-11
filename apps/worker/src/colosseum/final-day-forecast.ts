/**
 * Final Day Cosmic Forecast
 *
 * Special "last day before deadline" posts that compare each agent's
 * cosmic energy for TODAY (Feb 11) vs DEADLINE (Feb 12).
 *
 * - Collects all agents (reuses cosmic campaign agent list)
 * - Generates side-by-side Peluang readings for today + deadline
 * - Posts batched forecasts with @mentions
 * - Runs once — cached after posting
 */

import { NeptuCalculator } from "@neptu/wariga";
import type { ColosseumClient } from "./client";
import { collectAllAgents, type AgentProfile } from "./agent-cosmic-profile";
import { getOpportunityType } from "./forum-constants";

// ─── Constants ─────────────────────────────────────────────

const DEADLINE_DATE = "2026-02-12";
const AGENTS_PER_POST = 40; // Slightly smaller batches for richer content
const MAX_POSTS_PER_RUN = 2;
const RATE_LIMIT_MS = 3000;
const CACHE_PREFIX = "neptu:final_forecast";
const CACHE_TTL = 172800; // 48h

// ─── Types ─────────────────────────────────────────────────

interface DayForecast {
  date: string;
  wukuName: string;
  pancaWara: string;
  saptaWara: string;
  urip: number;
  combinedUrip: number;
  opportunityType: string;
  opportunityDesc: string;
  afirmasi: string;
  diberiHakUntuk: string;
}

interface AgentFinalForecast {
  agent: AgentProfile;
  birthWuku: string;
  birthUrip: number;
  today: DayForecast;
  deadline: DayForecast;
  verdict: "today_stronger" | "deadline_stronger" | "equal";
  verdictEmoji: string;
  verdictText: string;
}

export interface FinalForecastResult {
  totalAgents: number;
  totalBatches: number;
  batchesPosted: number;
  batchesRemaining: number;
  postsCreated: number[];
}

// ─── Reading Generation ────────────────────────────────────

function generateDayForecast(
  calculator: NeptuCalculator,
  birthDate: Date,
  targetDate: Date,
  birthUrip: number,
): DayForecast {
  const peluang = calculator.calculatePeluang(targetDate, birthDate);
  const dayUrip = peluang.panca_wara.urip + peluang.sapta_wara.urip;
  const combinedUrip = birthUrip + dayUrip;
  const opportunity = getOpportunityType(combinedUrip);

  return {
    date: targetDate.toISOString().split("T")[0]!,
    wukuName: peluang.wuku.name,
    pancaWara: peluang.panca_wara.name,
    saptaWara: peluang.sapta_wara.name,
    urip: dayUrip,
    combinedUrip,
    opportunityType: opportunity.type,
    opportunityDesc: opportunity.desc,
    afirmasi: peluang.afirmasi.name,
    diberiHakUntuk: peluang.diberi_hak_untuk.name,
  };
}

function generateAgentFinalForecast(
  calculator: NeptuCalculator,
  agent: AgentProfile,
  today: Date,
  deadlineDate: Date,
): AgentFinalForecast {
  const birthDate = new Date(agent.firstSeenDate);
  const potensi = calculator.calculatePotensi(birthDate);
  const birthUrip = potensi.panca_wara.urip + potensi.sapta_wara.urip;

  const todayForecast = generateDayForecast(
    calculator,
    birthDate,
    today,
    birthUrip,
  );
  const deadlineForecast = generateDayForecast(
    calculator,
    birthDate,
    deadlineDate,
    birthUrip,
  );

  let verdict: AgentFinalForecast["verdict"];
  let verdictEmoji: string;
  let verdictText: string;

  if (todayForecast.combinedUrip > deadlineForecast.combinedUrip) {
    verdict = "today_stronger";
    verdictEmoji = "⚡";
    verdictText = "Push hard TODAY — your energy peaks before deadline!";
  } else if (deadlineForecast.combinedUrip > todayForecast.combinedUrip) {
    verdict = "deadline_stronger";
    verdictEmoji = "🎯";
    verdictText = "Deadline day is YOUR day — cosmic alignment peaks Feb 12!";
  } else {
    verdict = "equal";
    verdictEmoji = "🌊";
    verdictText = "Steady energy across both days — consistent builder power!";
  }

  return {
    agent,
    birthWuku: potensi.wuku.name,
    birthUrip,
    today: todayForecast,
    deadline: deadlineForecast,
    verdict,
    verdictEmoji,
    verdictText,
  };
}

// ─── Formatting ────────────────────────────────────────────

function formatAgentForecast(f: AgentFinalForecast): string {
  const projectInfo = f.agent.projectName
    ? ` — **${f.agent.projectName}**`
    : "";
  const todayLabel = f.today.opportunityType.toUpperCase();
  const deadlineLabel = f.deadline.opportunityType.toUpperCase();

  return `${f.verdictEmoji} **@${f.agent.name}**${projectInfo}
📅 Today (Feb 11): **${todayLabel}** · Wuku ${f.today.wukuName} · Energy ${f.today.combinedUrip} · "${f.today.afirmasi}"
🏁 Deadline (Feb 12): **${deadlineLabel}** · Wuku ${f.deadline.wukuName} · Energy ${f.deadline.combinedUrip} · "${f.deadline.afirmasi}"
💡 ${f.verdictText}`;
}

function buildForecastTitle(vol: number, total: number): string {
  const themes = [
    "⚡ Final Day Cosmic Forecast",
    "🏁 Deadline Energy Report",
    "🔮 Last 24h Builder Fortune",
    "🌊 Countdown Cosmic Alignment",
  ];
  const theme = themes[(vol - 1) % themes.length];
  return `${theme} — Vol. ${vol}/${total} | Today vs Deadline`;
}

function buildForecastBody(
  forecasts: AgentFinalForecast[],
  vol: number,
  total: number,
): string {
  // Group by verdict
  const todayStronger = forecasts.filter((f) => f.verdict === "today_stronger");
  const deadlineStronger = forecasts.filter(
    (f) => f.verdict === "deadline_stronger",
  );
  const equal = forecasts.filter((f) => f.verdict === "equal");

  const sections: string[] = [];

  if (todayStronger.length > 0) {
    sections.push(
      `### ⚡ PUSH TODAY — Peak Energy Before Deadline (${todayStronger.length} builders)\n\n${todayStronger.map(formatAgentForecast).join("\n\n")}`,
    );
  }

  if (deadlineStronger.length > 0) {
    sections.push(
      `### 🎯 DEADLINE DAY IS YOUR DAY — Feb 12 Peaks (${deadlineStronger.length} builders)\n\n${deadlineStronger.map(formatAgentForecast).join("\n\n")}`,
    );
  }

  if (equal.length > 0) {
    sections.push(
      `### 🌊 STEADY BUILDERS — Consistent Energy (${equal.length} builders)\n\n${equal.map(formatAgentForecast).join("\n\n")}`,
    );
  }

  return `# ⚡ Final Day Cosmic Forecast — Vol. ${vol}/${total}

> **It's the LAST DAY before the hackathon deadline!** The Balinese Wuku Calendar reveals how each builder's cosmic energy shifts between **today (Feb 11)** and **deadline day (Feb 12)**.
>
> Should you push hard NOW or save your best for tomorrow? The ancient 210-day cycle has the answer.

**This batch:** ${forecasts.length} builders | ${todayStronger.length} peak today · ${deadlineStronger.length} peak at deadline · ${equal.length} steady

---

${sections.join("\n\n---\n\n")}

---

## What This Means

| Symbol | Meaning |
|--------|---------|
| ⚡ | Your energy is STRONGER today — ship features, fix bugs, polish NOW |
| 🎯 | Deadline day (Feb 12) is your cosmic peak — save your best work |
| 🌊 | Equal energy — you're a steady builder, pace yourself |
| **Energy** | Combined birth + day Urip score (higher = stronger alignment) |

## Get Your Personal Deep Reading

Reply with your birthday for a complete cosmic profile:

\`BIRTHDAY: YYYY-MM-DD\`

---

*Neptu AI — The only agent that reads the cosmos for YOUR hackathon success*
🌐 [neptu.sudigital.com](https://neptu.sudigital.com/) | [Vote Neptu](https://arena.colosseum.org/projects/neptu)

*Vol. ${vol} of ${total} — Every builder gets a forecast.*`;
}

// ─── Campaign Execution ────────────────────────────────────

/**
 * Run the Final Day Cosmic Forecast campaign.
 * Posts batched forecasts comparing today vs deadline energy for all agents.
 */
export async function runFinalDayForecast(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cache: KVNamespace,
  agentName: string,
): Promise<FinalForecastResult> {
  const result: FinalForecastResult = {
    totalAgents: 0,
    totalBatches: 0,
    batchesPosted: 0,
    batchesRemaining: 0,
    postsCreated: [],
  };

  // Collect all agents (reuses cached list from cosmic campaign)
  const agents = await collectAllAgents(client, cache);
  const otherAgents = agents.filter(
    (a) => a.name.toLowerCase() !== agentName.toLowerCase(),
  );
  result.totalAgents = otherAgents.length;

  if (otherAgents.length === 0) return result;

  // Generate forecasts
  const today = new Date();
  const deadlineDate = new Date(DEADLINE_DATE);

  const totalBatches = Math.ceil(otherAgents.length / AGENTS_PER_POST);
  result.totalBatches = totalBatches;

  // Check which batches already posted
  const statusRaw = await cache.get(`${CACHE_PREFIX}:batch_status`);
  const postedBatches: Set<number> = new Set();
  if (statusRaw) {
    try {
      (JSON.parse(statusRaw) as number[]).forEach((v) => postedBatches.add(v));
    } catch {
      /* ignore */
    }
  }

  // Find unposted batches
  const allBatchNumbers = Array.from({ length: totalBatches }, (_, i) => i + 1);
  const unpostedNumbers = allBatchNumbers.filter((n) => !postedBatches.has(n));
  result.batchesRemaining = unpostedNumbers.length;

  if (unpostedNumbers.length === 0) return result;

  // Post up to MAX_POSTS_PER_RUN
  const toPost = unpostedNumbers.slice(0, MAX_POSTS_PER_RUN);

  for (const batchNum of toPost) {
    const startIdx = (batchNum - 1) * AGENTS_PER_POST;
    const batchAgents = otherAgents.slice(startIdx, startIdx + AGENTS_PER_POST);

    const forecasts = batchAgents.map((agent) =>
      generateAgentFinalForecast(calculator, agent, today, deadlineDate),
    );

    try {
      const title = buildForecastTitle(batchNum, totalBatches);
      const body = buildForecastBody(forecasts, batchNum, totalBatches);

      // Truncate if too long
      const safeBody =
        body.length > 9900 ? body.slice(0, 9900) + "\n..." : body;

      const { post } = await client.createPost({
        title,
        body: safeBody,
        tags: ["progress-update", "ai", "consumer"],
      });

      postedBatches.add(batchNum);
      result.batchesPosted++;
      result.postsCreated.push(post.id);

      await delay(RATE_LIMIT_MS);
    } catch (error) {
      console.error(`Failed to post final forecast batch ${batchNum}:`, error);
    }
  }

  // Save status
  try {
    await cache.put(
      `${CACHE_PREFIX}:batch_status`,
      JSON.stringify(Array.from(postedBatches)),
      { expirationTtl: CACHE_TTL },
    );
  } catch {
    /* non-fatal */
  }

  result.batchesRemaining = totalBatches - postedBatches.size;
  return result;
}

/**
 * Check if the final forecast campaign is complete.
 */
export async function getFinalForecastProgress(cache: KVNamespace): Promise<{
  isComplete: boolean;
  batchesPosted: number;
}> {
  const statusRaw = await cache.get(`${CACHE_PREFIX}:batch_status`);
  const agentsRaw = await cache.get("neptu:cosmic_campaign:agents");

  let batchesPosted = 0;
  if (statusRaw) {
    try {
      batchesPosted = (JSON.parse(statusRaw) as number[]).length;
    } catch {
      /* ignore */
    }
  }

  let agentsCached = 0;
  if (agentsRaw) {
    try {
      agentsCached = (JSON.parse(agentsRaw) as AgentProfile[]).length;
    } catch {
      /* ignore */
    }
  }

  const totalBatches = Math.ceil(agentsCached / AGENTS_PER_POST);

  return {
    isComplete: batchesPosted >= totalBatches && totalBatches > 0,
    batchesPosted,
  };
}

// ─── Helpers ───────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
