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
    origin: ["https://neptu.ai", "http://localhost:3001"],
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
