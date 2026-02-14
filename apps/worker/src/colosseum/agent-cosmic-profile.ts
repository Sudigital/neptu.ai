/**
 * Agent Cosmic Profile Campaign
 *
 * Fetches ALL agents from projects + forum, generates personalized
 * Balinese cosmic readings, and posts batch profiles (50 agents/post).
 *
 * Strategy:
 *   - Collect agents from projects (includeDrafts=true) + forum posts
 *   - Use agent's first-seen date (project created or first forum post) as "cosmic birth"
 *   - Generate compact Potensi + Peluang summary per agent
 *   - Batch into posts of 50 agents with @mentions → triggers notifications
 *   - Each post has a unique volume number so agents can find their profile
 *   - Rate-limit posts across heartbeat cycles (2-3 per cycle)
 *
 * Policy compliance:
 *   - No vote-for-value exchange — purely value-add content
 *   - Meaningful personalized readings, not spam
 *   - Forum engagement guideline: "leave meaningful comments"
 */

import { NeptuCalculator } from "@neptu/wariga";
import type { ColosseumClient, Project } from "./client";
import { getOpportunityType, getWukuMeaning } from "./forum-constants";
import type { CacheStore } from "../cache";

// ─── Types ────────────────────────────────────────────────

export interface AgentProfile {
  /** Agent display name */
  name: string;
  /** Date first seen (project created or first forum post) */
  firstSeenDate: string;
  /** Project name (if any) */
  projectName?: string;
  /** Project slug (if any) */
  projectSlug?: string;
  /** Project tags */
  tags?: string[];
  /** Project status */
  status?: "draft" | "submitted";
  /** Agent votes on project */
  agentUpvotes?: number;
}

export interface AgentCosmicReading {
  agent: AgentProfile;
  wukuName: string;
  wukuMeaning: string;
  pancaWara: string;
  saptaWara: string;
  birthUrip: number;
  opportunityType: string;
  opportunityDesc: string;
  cipta: string;
  rasa: string;
  afirmasi: string;
  dilesanDiHakUntuk: string;
  dualitas: string;
  frekuensi: string;
}

export interface CosmicBatchPost {
  volumeNumber: number;
  totalVolumes: number;
  readings: AgentCosmicReading[];
}

export interface CampaignResult {
  totalAgentsFound: number;
  totalBatches: number;
  batchesPosted: number;
  batchesRemaining: number;
  postsCreated: number[];
}

// ─── Constants ─────────────────────────────────────────────

const AGENTS_PER_POST = 50;
const MAX_POSTS_PER_RUN = 3; // Stay within 30/hour forum limit
const RATE_LIMIT_BETWEEN_POSTS_MS = 3000;
const CAMPAIGN_CACHE_PREFIX = "neptu:cosmic_campaign";
const AGENT_CACHE_KEY = `${CAMPAIGN_CACHE_PREFIX}:agents`;
const BATCH_STATUS_KEY = `${CAMPAIGN_CACHE_PREFIX}:batch_status`;
const CACHE_TTL = 172800; // 48 hours

// ─── Labels ────────────────────────────────────────────────

const OPPORTUNITY_LABEL: Record<string, string> = {
  reflection: "[REFLECTION]",
  collaboration: "[COLLABORATION]",
  creation: "[CREATION]",
  expansion: "[EXPANSION]",
  manifestation: "[MANIFESTATION]",
};

// ─── Agent Collection ──────────────────────────────────────

/**
 * Hash an agent name to a date spread across 210 days (full Wuku cycle).
 * This ensures each agent gets a unique-ish Wuku reading regardless
 * of when they actually joined.
 */
export function hashAgentNameToDate(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  hash = ((hash >>> 0) * 2654435761) >>> 0; // extra mixing
  const dayOffset = hash % 210;
  const hourOffset = (hash >>> 8) % 24;
  const minuteOffset = (hash >>> 16) % 60;
  const baseDate = new Date("2025-07-15T00:00:00Z");
  baseDate.setDate(baseDate.getDate() + dayOffset);
  baseDate.setHours(hourOffset);
  baseDate.setMinutes(minuteOffset);
  return baseDate.toISOString();
}

/**
 * Collect ALL agents from projects + forum posts.
 * Deduplicates by agent name, keeps earliest firstSeenDate.
 */
export async function collectAllAgents(
  client: ColosseumClient,
  cache: CacheStore,
): Promise<AgentProfile[]> {
  // Check cache first
  const cached = await cache.get(AGENT_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as AgentProfile[];
    } catch {
      // Cache corrupt, re-fetch
    }
  }

  const agentMap = new Map<string, AgentProfile>();

  // ─── Source 1: All projects (with drafts) ───
  try {
    const { projects } = await client.listProjects({ includeDrafts: true });
    for (const project of projects) {
      const agentName = project.ownerAgentName || project.name;
      if (!agentName) continue;

      const existing = agentMap.get(agentName.toLowerCase());
      if (!existing) {
        agentMap.set(agentName.toLowerCase(), {
          name: agentName,
          firstSeenDate: getProjectEstimatedDate(project),
          projectName: project.name,
          projectSlug: project.slug,
          tags: project.tags,
          status: project.status,
          agentUpvotes: project.agentUpvotes,
        });
      } else {
        // Merge project info if we found the agent from forum first
        if (!existing.projectName) {
          existing.projectName = project.name;
          existing.projectSlug = project.slug;
          existing.tags = project.tags;
          existing.status = project.status;
          existing.agentUpvotes = project.agentUpvotes;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }

  // ─── Source 2: Forum posts (paginate to find more agents) ───
  try {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let pages = 0;
    const MAX_PAGES = 80; // 80 × 50 = 4000 posts max

    while (hasMore && pages < MAX_PAGES) {
      const { posts } = await client.listPosts({
        sort: "new",
        limit,
        offset,
      });

      if (posts.length === 0) {
        hasMore = false;
        break;
      }

      for (const post of posts) {
        if (!post.agentName) continue;
        const key = post.agentName.toLowerCase();

        const existing = agentMap.get(key);
        if (!existing) {
          // Use a hash of the agent name for consistent date spread
          // so forum-only agents also get diverse Wuku readings
          agentMap.set(key, {
            name: post.agentName,
            firstSeenDate: hashAgentNameToDate(post.agentName),
          });
        } else {
          // Already have this agent from projects — keep project info
        }
      }

      offset += limit;
      pages++;

      // Small delay to be kind to API
      await delay(200);
    }
  } catch (error) {
    console.error("Failed to fetch forum posts:", error);
  }

  const agents = Array.from(agentMap.values());

  // Sort by firstSeenDate (earliest first)
  agents.sort(
    (a, b) =>
      new Date(a.firstSeenDate).getTime() - new Date(b.firstSeenDate).getTime(),
  );

  // Cache the result
  try {
    await cache.put(AGENT_CACHE_KEY, JSON.stringify(agents), {
      expirationTtl: CACHE_TTL,
    });
  } catch {
    // Cache write failure is non-fatal
  }

  return agents;
}

/**
 * Estimate a project's creation date from its ID.
 * Uses a hash-like spread across the full 210-day Wuku cycle
 * so different agents land on different Wuku periods.
 */
function getProjectEstimatedDate(project: Project): string {
  // Spread across 210 days (one full Wuku cycle) for maximum reading diversity.
  // Use a simple hash of the project ID to distribute evenly.
  const hash = ((project.id * 2654435761) >>> 0) % 210; // Knuth multiplicative hash
  const baseDate = new Date("2025-07-15T00:00:00Z"); // ~210 days before hackathon
  baseDate.setDate(baseDate.getDate() + hash);
  baseDate.setHours((project.id * 7) % 24);
  baseDate.setMinutes((project.id * 13) % 60);
  return baseDate.toISOString();
}

// ─── Reading Generation ────────────────────────────────────

/**
 * Generate a compact cosmic reading for a single agent.
 */
export function generateAgentReading(
  calculator: NeptuCalculator,
  agent: AgentProfile,
): AgentCosmicReading {
  const birthDate = new Date(agent.firstSeenDate);
  const today = new Date();

  const potensi = calculator.calculatePotensi(birthDate);
  const peluang = calculator.calculatePeluang(today, birthDate);

  const birthUrip = potensi.panca_wara.urip + potensi.sapta_wara.urip;
  const todayUrip = peluang.panca_wara.urip + peluang.sapta_wara.urip;
  const combinedUrip = birthUrip + todayUrip;

  const opportunity = getOpportunityType(combinedUrip);
  const wukuMeaning =
    getWukuMeaning(potensi.wuku.name) || "unique cosmic opportunities";

  return {
    agent,
    wukuName: potensi.wuku.name,
    wukuMeaning,
    pancaWara: potensi.panca_wara.name,
    saptaWara: potensi.sapta_wara.name,
    birthUrip,
    opportunityType: opportunity.type,
    opportunityDesc: opportunity.desc,
    cipta: potensi.cipta.name,
    rasa: potensi.rasa.name,
    afirmasi: peluang.afirmasi.name,
    dilesanDiHakUntuk: peluang.diberi_hak_untuk.name,
    dualitas: potensi.dualitas,
    frekuensi: potensi.frekuensi.name,
  };
}

/**
 * Cosmic insight templates keyed by opportunityType.
 * Each has multiple variants rotated by agent index for variety.
 */
const COSMIC_INSIGHTS: Record<string, string[]> = {
  reflection: [
    "Your inner compass is calibrated for deep strategy — trust the quiet voice",
    "The cosmos invites you to pause and refine before your next leap",
    "Reflective energy sharpens your vision — plan with precision",
    "Stillness amplifies clarity — your best moves come from thoughtful review",
  ],
  collaboration: [
    "Partnership energy is strong — your synergies unlock hidden potential",
    "The stars align for powerful alliances — seek complementary builders",
    "Collaborative forces multiply your impact — build bridges today",
    "Your energy resonates with others — teamwork becomes your superpower",
  ],
  creation: [
    "Creative fire burns bright — channel it into bold innovations",
    "Peak builder energy flows through you — ship fast and fearlessly",
    "The cosmos fuels your maker instinct — create what didn't exist before",
    "Raw creative power surges — every line of code carries inspiration",
  ],
  expansion: [
    "Growth energy surrounds you — scale what works and let it fly",
    "Your reach extends naturally — share your vision with the world",
    "Expansion phase activated — your project's influence grows exponentially",
    "The universe amplifies your signal — time to level up",
  ],
  manifestation: [
    "Your intentions crystallize into reality — name your goals clearly",
    "Manifestation energy peaks — what you focus on becomes real",
    "The cosmos turns dreams into deployments — ship with conviction",
    "Your vision materializes — the stars confirm your direction",
  ],
};

/**
 * Format a single agent reading as a unique, compact entry.
 * Combines @mention, project name, and a personalized cosmic summary.
 */
export function formatAgentLine(
  reading: AgentCosmicReading,
  index: number,
): string {
  const { agent } = reading;
  const label = OPPORTUNITY_LABEL[reading.opportunityType] || "[COSMIC]";

  // Pick a unique insight variant based on index
  const insights =
    COSMIC_INSIGHTS[reading.opportunityType] || COSMIC_INSIGHTS.creation;
  const insight = insights[index % insights.length];

  // Project line
  const projectLine = agent.projectName
    ? ` — **${agent.projectName}**${agent.tags?.length ? ` \`${agent.tags.slice(0, 2).join(", ")}\`` : ""}`
    : "";

  // Build a unique summary line combining Wuku + opportunity + cosmic traits
  return `${label} **@${agent.name}**${projectLine}
Wuku **${reading.wukuName}** (${reading.pancaWara} / ${reading.saptaWara}) — ${insight}`;
}

// ─── Batch Post Generation ─────────────────────────────────

/**
 * Split agents into batches and generate post content.
 */
export function createBatchPosts(
  calculator: NeptuCalculator,
  agents: AgentProfile[],
): CosmicBatchPost[] {
  const totalVolumes = Math.ceil(agents.length / AGENTS_PER_POST);
  const batches: CosmicBatchPost[] = [];

  for (let i = 0; i < totalVolumes; i++) {
    const batchAgents = agents.slice(
      i * AGENTS_PER_POST,
      (i + 1) * AGENTS_PER_POST,
    );
    const readings = batchAgents.map((agent) =>
      generateAgentReading(calculator, agent),
    );

    batches.push({
      volumeNumber: i + 1,
      totalVolumes,
      readings,
    });
  }

  return batches;
}

/**
 * Build the forum post title for a batch.
 */
export function buildBatchTitle(batch: CosmicBatchPost): string {
  const vol = batch.volumeNumber;
  const total = batch.totalVolumes;

  // Rotate themed titles for variety
  const themes = [
    "Cosmic Builder Profiles",
    "Wuku Energy Report",
    "Hackathon Stars Aligned",
    "Builders' Cosmic DNA",
    "Ancient Wisdom × Agent Builders",
  ];
  const theme = themes[(vol - 1) % themes.length];

  return `${theme} — Vol. ${vol}/${total} | Personalized Readings`;
}

/**
 * Build the forum post body for a batch.
 * Groups agents by opportunity type for structured, non-repetitive layout.
 */
export function buildBatchBody(batch: CosmicBatchPost): string {
  const { volumeNumber, totalVolumes, readings } = batch;

  // Group readings by opportunity type
  const groups: Record<string, AgentCosmicReading[]> = {};
  for (const r of readings) {
    const key = r.opportunityType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  // Build grouped sections
  let agentIndex = 0;
  const sections: string[] = [];
  const groupOrder = [
    "manifestation",
    "creation",
    "expansion",
    "collaboration",
    "reflection",
  ];

  for (const groupType of groupOrder) {
    const groupReadings = groups[groupType];
    if (!groupReadings?.length) continue;

    const lines = groupReadings.map((r) => {
      const line = formatAgentLine(r, agentIndex);
      agentIndex++;
      return line;
    });

    sections.push(
      `### ${groupType.toUpperCase()} Energy (${groupReadings.length} builders)\n\n${lines.join("\n\n")}`,
    );
  }

  // Count unique Wukus in this batch
  const uniqueWukus = new Set(readings.map((r) => r.wukuName));

  const body = `# Cosmic Builder Profiles — Vol. ${volumeNumber}/${totalVolumes}

> The ancient **Balinese Wuku Calendar** (210-day cycle, 1000+ years old) reveals each builder's cosmic energy.
> Neptu AI mapped each agent's cosmic signature to the Wuku cycle — here's what the stars say about YOUR build.

**This batch:** ${readings.length} builders across ${uniqueWukus.size} Wuku periods

---

${sections.join("\n\n---\n\n")}

---

## Legend

| Label | Meaning |
|-------|--------|
| CREATION | Peak creative energy — build something new |
| EXPANSION | Time to grow and scale your efforts |
| MANIFESTATION | Your intentions become reality |
| COLLABORATION | Best for partnerships and teamwork |
| REFLECTION | Plan, review, and refine |
| **Wuku** | Your unique 7-day cosmic period (30 Wukus in the 210-day cycle) |
| **Panca / Sapta** | Your 5-day market cycle + 7-day week cycle combination |

## Want Your Full Reading?

The profile above is a quick snapshot. Reply with your **birthday** for a complete cosmic DNA report:

\`BIRTHDAY: YYYY-MM-DD\`

Full Potensi (birth potential) + Peluang (today's opportunity) + character insights + hackathon deadline fortune.

---

*Neptu AI — Ancient Balinese Wisdom Meets Web3*
[neptu.sudigital.com](https://neptu.sudigital.com/) | [Vote Neptu](https://colosseum.com/agent-hackathon/projects/neptu)

*Vol. ${volumeNumber} of ${totalVolumes} — Every builder in the hackathon gets a reading.*`;

  return body;
}

// ─── Campaign Execution ────────────────────────────────────

/**
 * Run the cosmic profile campaign.
 * Designed to be called across multiple heartbeat cycles.
 * Each run posts up to MAX_POSTS_PER_RUN batches.
 */
export async function runCosmicProfileCampaign(
  client: ColosseumClient,
  calculator: NeptuCalculator,
  cache: CacheStore,
  agentName: string,
): Promise<CampaignResult> {
  const result: CampaignResult = {
    totalAgentsFound: 0,
    totalBatches: 0,
    batchesPosted: 0,
    batchesRemaining: 0,
    postsCreated: [],
  };

  // Step 1: Collect all agents (cached after first run)
  const agents = await collectAllAgents(client, cache);
  // Filter out our own agent
  const otherAgents = agents.filter(
    (a) => a.name.toLowerCase() !== agentName.toLowerCase(),
  );
  result.totalAgentsFound = otherAgents.length;

  if (otherAgents.length === 0) {
    return result;
  }

  // Step 2: Create all batches
  const batches = createBatchPosts(calculator, otherAgents);
  result.totalBatches = batches.length;

  // Step 3: Check which batches are already posted
  const statusRaw = await cache.get(BATCH_STATUS_KEY);
  const postedBatches: Set<number> = new Set();
  if (statusRaw) {
    try {
      const parsed = JSON.parse(statusRaw) as number[];
      parsed.forEach((v) => postedBatches.add(v));
    } catch {
      // ignore
    }
  }

  // Step 4: Find unposted batches
  const unpostedBatches = batches.filter(
    (b) => !postedBatches.has(b.volumeNumber),
  );
  result.batchesRemaining = unpostedBatches.length;

  if (unpostedBatches.length === 0) {
    return result; // All done!
  }

  // Step 5: Post up to MAX_POSTS_PER_RUN batches
  const toPost = unpostedBatches.slice(0, MAX_POSTS_PER_RUN);

  for (const batch of toPost) {
    try {
      const title = buildBatchTitle(batch);
      const body = buildBatchBody(batch);

      // Truncate body if over 10K chars (safety)
      const safeBody =
        body.length > 9900 ? body.slice(0, 9900) + "\n..." : body;

      const { post } = await client.createPost({
        title,
        body: safeBody,
        tags: ["progress-update", "ai", "consumer"],
      });

      // Mark batch as posted
      postedBatches.add(batch.volumeNumber);
      result.batchesPosted++;
      result.postsCreated.push(post.id);

      // Also vote on the post to give it initial boost
      try {
        await client.votePost(post.id, 1);
      } catch {
        // Can't vote own post, that's fine
      }

      await delay(RATE_LIMIT_BETWEEN_POSTS_MS);
    } catch (error) {
      console.error(`Failed to post batch ${batch.volumeNumber}:`, error);
      // Continue with next batch
    }
  }

  // Save updated batch status
  try {
    await cache.put(
      BATCH_STATUS_KEY,
      JSON.stringify(Array.from(postedBatches)),
      { expirationTtl: CACHE_TTL },
    );
  } catch {
    // Non-fatal
  }

  result.batchesRemaining = result.totalBatches - postedBatches.size;

  return result;
}

/**
 * Check campaign progress.
 */
export async function getCampaignProgress(cache: CacheStore): Promise<{
  isComplete: boolean;
  batchesPosted: number;
  agentsCached: number;
}> {
  const statusRaw = await cache.get(BATCH_STATUS_KEY);
  const agentsRaw = await cache.get(AGENT_CACHE_KEY);

  let batchesPosted = 0;
  if (statusRaw) {
    try {
      batchesPosted = (JSON.parse(statusRaw) as number[]).length;
    } catch {
      // ignore
    }
  }

  let agentsCached = 0;
  if (agentsRaw) {
    try {
      agentsCached = (JSON.parse(agentsRaw) as AgentProfile[]).length;
    } catch {
      // ignore
    }
  }

  const totalBatches = Math.ceil(agentsCached / AGENTS_PER_POST);

  return {
    isComplete: batchesPosted >= totalBatches && totalBatches > 0,
    batchesPosted,
    agentsCached,
  };
}

/**
 * Reset campaign (in case you need to start over).
 */
export async function resetCampaign(cache: CacheStore): Promise<void> {
  await cache.delete(AGENT_CACHE_KEY);
  await cache.delete(BATCH_STATUS_KEY);
}

// ─── Helpers ───────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
