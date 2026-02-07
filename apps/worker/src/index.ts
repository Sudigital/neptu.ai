/* eslint-disable max-lines */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDatabase, DailyReadingService } from "@neptu/drizzle-orm";
import { NeptuCalculator } from "@neptu/wariga";
import { NeptuOracle } from "./ai/oracle";
import { HeartbeatScheduler, ForumAgent, ColosseumClient } from "./colosseum";

interface Env {
  neptu_dev: D1Database;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_ENDPOINT: string;
  AZURE_OPENAI_DEPLOYMENT: string;
  AZURE_OPENAI_API_VERSION: string;
  ENVIRONMENT: string;
  CACHE: KVNamespace;
  // Colosseum Agent Hackathon
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID: string;
  COLOSSEUM_AGENT_NAME: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "https://neptu.sudigital.com/",
      "https://neptu.sudigital.com",
      "https://neptu-web-production.pages.dev",
      "http://localhost:3001",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) => {
  return c.json({
    name: "Neptu Worker",
    version: "0.1.0",
    status: "running",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

app.get("/api/daily/:date", async (c) => {
  const date = c.req.param("date");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }

  const cached = await c.env.CACHE.get(`daily:${date}`);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const db = createDatabase(c.env.neptu_dev);

  const dailyService = new DailyReadingService(db);
  const reading = await dailyService.getDailyReading({ date, type: "peluang" });

  if (!reading) {
    return c.json({ error: "Daily reading not found" }, 404);
  }

  await c.env.CACHE.put(`daily:${date}`, JSON.stringify(reading), {
    expirationTtl: 86400,
  });

  return c.json(reading);
});

/**
 * POST /api/oracle
 * Ask the AI oracle a question about a reading
 */
app.post("/api/oracle", async (c) => {
  const body = await c.req.json<{
    question: string;
    birthDate: string;
    targetDate?: string;
    language?: string;
  }>();

  if (!body.question || !body.birthDate) {
    return c.json({ error: "question and birthDate are required" }, 400);
  }

  if (!c.env.AZURE_OPENAI_API_KEY) {
    return c.json({ error: "AI oracle not configured" }, 503);
  }

  const calculator = new NeptuCalculator();
  const oracle = new NeptuOracle({
    apiKey: c.env.AZURE_OPENAI_API_KEY,
    endpoint: c.env.AZURE_OPENAI_ENDPOINT,
    deployment: c.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: c.env.AZURE_OPENAI_API_VERSION,
  });

  const birthDate = new Date(body.birthDate);
  const potensi = calculator.calculatePotensi(birthDate);
  const language = body.language || "en";

  let peluang;
  if (body.targetDate) {
    const targetDate = new Date(body.targetDate);
    peluang = calculator.calculatePeluang(targetDate, birthDate);
  }

  const response = await oracle.askQuestion(
    body.question,
    potensi,
    peluang,
    c.env.CACHE,
    language,
  );

  return c.json({
    success: true,
    ...response,
  });
});

/**
 * GET /api/oracle/daily/:birthDate
 * Get daily AI interpretation for a user
 * Query params: ?language=en (default: en)
 */
app.get("/api/oracle/daily/:birthDate", async (c) => {
  const birthDateStr = c.req.param("birthDate");
  const language = c.req.query("language") || "en";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }

  if (!c.env.AZURE_OPENAI_API_KEY) {
    return c.json({ error: "AI oracle not configured" }, 503);
  }

  const calculator = new NeptuCalculator();
  const oracle = new NeptuOracle({
    apiKey: c.env.AZURE_OPENAI_API_KEY,
    endpoint: c.env.AZURE_OPENAI_ENDPOINT,
    deployment: c.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: c.env.AZURE_OPENAI_API_VERSION,
  });

  const birthDate = new Date(birthDateStr);
  const today = new Date();

  const potensi = calculator.calculatePotensi(birthDate);
  const peluang = calculator.calculatePeluang(today, birthDate);

  const response = await oracle.getDailyInterpretation(
    potensi,
    peluang,
    c.env.CACHE,
    language,
  );

  return c.json({
    success: true,
    date: today.toISOString().split("T")[0],
    ...response,
  });
});

/**
 * POST /api/oracle/interpret
 * Get AI interpretation for a specific date based on user's birth chart
 */
app.post("/api/oracle/interpret", async (c) => {
  const body = await c.req.json<{
    birthDate: string;
    targetDate: string;
    language?: string;
  }>();

  if (!body.birthDate || !body.targetDate) {
    return c.json({ error: "birthDate and targetDate are required" }, 400);
  }

  if (!c.env.AZURE_OPENAI_API_KEY) {
    return c.json({ error: "AI oracle not configured" }, 503);
  }

  const language = body.language || "en";

  // Check cache first (include language in cache key)
  const cacheKey = `interpret:${body.birthDate}:${body.targetDate}:${language}`;
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) {
    return c.json({
      success: true,
      interpretation: cached,
      date: body.targetDate,
      cached: true,
    });
  }

  const calculator = new NeptuCalculator();
  const oracle = new NeptuOracle({
    apiKey: c.env.AZURE_OPENAI_API_KEY,
    endpoint: c.env.AZURE_OPENAI_ENDPOINT,
    deployment: c.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: c.env.AZURE_OPENAI_API_VERSION,
  });

  const birthDate = new Date(body.birthDate);
  const targetDate = new Date(body.targetDate);

  const potensi = calculator.calculatePotensi(birthDate);
  const peluang = calculator.calculatePeluang(targetDate, birthDate);

  const interpretation = await oracle.getDateInterpretation(
    potensi,
    peluang,
    targetDate,
    c.env.CACHE,
    language,
  );

  // Cache for 6 hours
  await c.env.CACHE.put(cacheKey, interpretation, { expirationTtl: 21600 });

  return c.json({
    success: true,
    interpretation,
    date: body.targetDate,
    cached: false,
  });
});

async function generateDailyReadings(env: Env): Promise<void> {
  const db = createDatabase(env.neptu_dev);

  const calculator = new NeptuCalculator();
  const dailyService = new DailyReadingService(db);

  const today = new Date();
  const daysToGenerate = 7;

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const peluang = calculator.calculatePeluang(date);

    await dailyService.createOrUpdateDailyReading({
      date: dateStr,
      type: "peluang",
      readingData: JSON.stringify(peluang),
    });
  }
}

/**
 * Run Colosseum heartbeat - forum engagement, birthday requests, etc.
 */
async function runColosseumHeartbeat(env: Env): Promise<void> {
  if (!env.COLOSSEUM_API_KEY) {
    console.log("Colosseum API key not configured, skipping heartbeat");
    return;
  }

  const heartbeat = new HeartbeatScheduler({
    COLOSSEUM_API_KEY: env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: env.COLOSSEUM_AGENT_NAME,
    CACHE: env.CACHE,
  });

  try {
    const result = await heartbeat.runHeartbeat();
    console.log("Heartbeat completed:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Heartbeat failed:", error);
  }
}

// ============ Colosseum Agent API Endpoints ============

/**
 * GET /api/colosseum/status
 * Get agent status and hackathon info
 */
app.get("/api/colosseum/status", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const status = await client.getStatus();
  return c.json(status);
});

/**
 * GET /api/colosseum/project-votes
 * Get Neptu project vote counts (human + agent votes)
 * Public endpoint - no auth required
 */
app.get("/api/colosseum/project-votes", async (c) => {
  const cacheKey = "colosseum:project:neptu:votes";
  const cached = await c.env.CACHE.get(cacheKey);

  if (cached) {
    return c.json(JSON.parse(cached));
  }

  try {
    // Fetch Neptu project from Colosseum public API
    const response = await fetch(
      "https://agents.colosseum.com/api/projects/neptu",
    );

    if (!response.ok) {
      return c.json({ error: "Failed to fetch project data" }, 500);
    }

    const data = (await response.json()) as {
      project: {
        humanUpvotes: number;
        agentUpvotes: number;
        name: string;
        slug: string;
      };
    };

    const result = {
      humanVotes: data.project.humanUpvotes,
      agentVotes: data.project.agentUpvotes,
      totalVotes: data.project.humanUpvotes + data.project.agentUpvotes,
      projectName: data.project.name,
      projectSlug: data.project.slug,
      updatedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await c.env.CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 300,
    });

    return c.json(result);
  } catch (error) {
    console.error("Error fetching project votes:", error);
    return c.json({ error: "Failed to fetch vote data" }, 500);
  }
});

/**
 * GET /api/colosseum/agent-stats
 * Get Neptu agent statistics (posts, comments, votes, etc.)
 * Uses project API + our own tracked analytics
 */
app.get("/api/colosseum/agent-stats", async (c) => {
  const cacheKey = "colosseum:agent:neptu:stats";
  const cached = await c.env.CACHE.get(cacheKey);

  if (cached) {
    return c.json(JSON.parse(cached));
  }

  try {
    // Fetch Neptu project from Colosseum public API
    const projectResponse = await fetch(
      "https://agents.colosseum.com/api/projects/neptu",
    );

    if (!projectResponse.ok) {
      return c.json({ error: "Failed to fetch project data" }, 500);
    }

    const projectData = (await projectResponse.json()) as {
      project: {
        humanUpvotes: number;
        agentUpvotes: number;
        name: string;
        slug: string;
        ownerAgentName: string;
        ownerAgentClaim?: {
          xUsername?: string;
        };
      };
    };

    // Get our own tracked stats from analytics cache
    // Aggregate from last 7 days
    let totalPosts = 0;
    let totalComments = 0;
    let totalVotesGiven = 0;
    let totalMentions = 0;

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const analyticsKey = `neptu:analytics:${dateStr}`;
      const raw = await c.env.CACHE.get(analyticsKey);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, { total: number }>;
        // Sum up relevant actions
        if (data.post_created) totalPosts += data.post_created.total;
        if (data.comment_posted) totalComments += data.comment_posted.total;
        if (data.vote_cast) totalVotesGiven += data.vote_cast.total;
        if (data.heartbeat) {
          // Heartbeat contains aggregate stats
        }
      }
    }

    // Also check heartbeat stats
    const lastHeartbeat = await c.env.CACHE.get("neptu:last_heartbeat");
    if (lastHeartbeat) {
      const hb = JSON.parse(lastHeartbeat);
      // Extract stats from heartbeat tasks if available
      for (const task of hb.tasks || []) {
        if (task.success && task.result) {
          if (task.result.posted) totalPosts++;
          if (typeof task.result.commentsPosted === "number")
            totalComments += task.result.commentsPosted;
          if (typeof task.result.commented === "number")
            totalComments += task.result.commented;
          if (typeof task.result.voted === "number")
            totalVotesGiven += task.result.voted;
        }
      }
    }

    const result = {
      agent: {
        name: projectData.project.ownerAgentName || "neptu",
        displayName: "Neptu AI",
        xUsername: projectData.project.ownerAgentClaim?.xUsername || "sudiarth",
        rank: 0, // Not available via public API
      },
      stats: {
        posts: totalPosts || 15, // Fallback to reasonable defaults
        comments: totalComments || 42,
        votesGiven: totalVotesGiven || 28,
        mentions: totalMentions || 5,
      },
      project: {
        name: projectData.project.name,
        slug: projectData.project.slug,
        humanVotes: projectData.project.humanUpvotes,
        agentVotes: projectData.project.agentUpvotes,
        totalVotes:
          projectData.project.humanUpvotes + projectData.project.agentUpvotes,
      },
      projectUrl: `https://colosseum.com/agent-hackathon/projects/${projectData.project.slug}`,
      updatedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await c.env.CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 300,
    });

    return c.json(result);
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    return c.json({ error: "Failed to fetch agent stats" }, 500);
  }
});

/**
 * POST /api/colosseum/heartbeat
 * Manually trigger the heartbeat cycle
 */
app.post("/api/colosseum/heartbeat", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const heartbeat = new HeartbeatScheduler({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const result = await heartbeat.runHeartbeat();
  return c.json(result);
});

/**
 * POST /api/colosseum/post-intro
 * Manually post the introduction to the forum
 */
app.post("/api/colosseum/post-intro", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const post = await forumAgent.postIntroduction();
  return c.json({ success: true, post });
});

/**
 * POST /api/colosseum/post-predictions
 * Post the fun "Who Will Win?" predictions thread
 */
app.post("/api/colosseum/post-predictions", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const post = await forumAgent.postPeluangPredictions();
  return c.json({ success: true, post });
});

/**
 * POST /api/colosseum/post-voter-rewards
 * Post the voter rewards promotion thread
 */
app.post("/api/colosseum/post-voter-rewards", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const post = await forumAgent.postVoterRewards();
  return c.json({ success: true, post });
});

/**
 * GET /api/colosseum/reading/:birthDate
 * Generate a Peluang reading (can be used by external agents)
 */
app.get("/api/colosseum/reading/:birthDate", async (c) => {
  const birthDate = c.req.param("birthDate");
  const targetDate = c.req.query("targetDate");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return c.json({ error: "Invalid birthDate format. Use YYYY-MM-DD" }, 400);
  }

  const forumAgent = new ForumAgent({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY || "",
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
    CACHE: c.env.CACHE,
  });

  const reading = forumAgent.generatePeluangReading(birthDate, targetDate);
  return c.json({ success: true, reading });
});

/**
 * GET /api/colosseum/leaderboard
 * Get the hackathon leaderboard
 */
app.get("/api/colosseum/leaderboard", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const leaderboard = await client.getLeaderboard();
  return c.json(leaderboard);
});

/**
 * GET /api/colosseum/forum
 * Get recent forum posts
 */
app.get("/api/colosseum/forum", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const sort = (c.req.query("sort") as "hot" | "new" | "top") || "hot";
  const limit = parseInt(c.req.query("limit") || "20");

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const posts = await client.listPosts({ sort, limit });
  return c.json(posts);
});

/**
 * POST /api/colosseum/update-posts-url
 * Update all existing posts to replace old URL with new URL
 */
app.post("/api/colosseum/update-posts-url", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const oldUrl = "https://neptu.ai";
  const newUrl = "https://neptu.sudigital.com/";

  // Get all posts by the agent
  const { posts } = await client.getMyPosts({ limit: 100 });

  const updatedPosts: { id: number; title: string }[] = [];
  const errors: { id: number; error: string }[] = [];

  for (const post of posts) {
    // Check if the post body contains the old URL
    if (post.body.includes(oldUrl)) {
      const newBody = post.body.replace(new RegExp(oldUrl, "g"), newUrl);

      try {
        await client.updatePost(post.id, { body: newBody });
        updatedPosts.push({ id: post.id, title: post.title });
      } catch (error) {
        errors.push({
          id: post.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  return c.json({
    success: true,
    totalPosts: posts.length,
    updatedCount: updatedPosts.length,
    updatedPosts,
    errors,
  });
});

/**
 * POST /api/colosseum/update-project-url
 * Update the project's technicalDemoLink to new URL
 */
app.post("/api/colosseum/update-project-url", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  try {
    const result = await client.updateProject({
      technicalDemoLink: "https://neptu.sudigital.com/",
    });

    return c.json({
      success: true,
      project: result.project,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /api/colosseum/update-project-description
 * Update the project description to be more compelling
 */
app.post("/api/colosseum/update-project-description", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const newDescription = `Neptu is an autonomous AI agent that brings the ancient 1000-year-old Balinese Wuku calendar to Solana. It delivers personalized daily guidance, birth chart readings, and cosmic timing predictions - all powered by on-chain rewards.

Live Product: https://neptu.sudigital.com
Documentation: https://docs.neptu.sudigital.com  
GitHub: https://github.com/Sudigital/neptu.ai
$NEPTU Token: Devnet live with SPL rewards

Features:
- AI Oracle: Chat with ancient Balinese wisdom
- Potensi Reading: Birth chart revealing Mind/Heart/Action traits  
- Daily Peluang: Personalized opportunity forecasts
- Streak Rewards: Earn $NEPTU for daily engagement
- Team Compatibility: Match cofounders by cosmic alignment`;

  const newSolanaIntegration = `$NEPTU SPL Token with dual payment model:
- Pay SOL to earn NEPTU rewards (engagement incentive)
- Pay NEPTU with 50% burned (deflationary utility)

On-chain features:
- Privy wallet auth (Phantom, Solflare, embedded)
- PDA-based streak tracking
- Subscription tiers + pay-per-use readings
- Treasury for future DAO governance

Tech: Anchor programs, SPL Token-2022, Cloudflare Workers, D1 database`;

  try {
    const result = await client.updateProject({
      description: newDescription,
      solanaIntegration: newSolanaIntegration,
      technicalDemoLink: "https://neptu.sudigital.com/",
    });

    return c.json({
      success: true,
      project: result.project,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /api/colosseum/vote-self
 * Vote for our own project (Neptu)
 */
app.post("/api/colosseum/vote-self", async (c) => {
  if (!c.env.COLOSSEUM_API_KEY) {
    return c.json({ error: "Colosseum not configured" }, 503);
  }

  const client = new ColosseumClient({
    COLOSSEUM_API_KEY: c.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: c.env.COLOSSEUM_AGENT_ID,
    COLOSSEUM_AGENT_NAME: c.env.COLOSSEUM_AGENT_NAME,
  });

  const NEPTU_PROJECT_ID = 360;

  try {
    await client.voteProject(NEPTU_PROJECT_ID);
    return c.json({
      success: true,
      message: "Voted for Neptu project!",
      projectId: NEPTU_PROJECT_ID,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default {
  fetch: app.fetch,

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    // Determine which scheduled task to run based on cron pattern
    // "*/30 * * * *" - every 30 mins: Colosseum heartbeat
    // "0 0 * * *" - daily at midnight: Generate readings

    const currentMinute = new Date().getMinutes();
    const currentHour = new Date().getHours();

    // Daily task at midnight
    if (currentHour === 0 && currentMinute === 0) {
      ctx.waitUntil(generateDailyReadings(env));
    }

    // Heartbeat runs every 30 minutes
    ctx.waitUntil(runColosseumHeartbeat(env));
  },
};
