/** Neptu Worker - Main entry point */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDatabase, DailyReadingService } from "@neptu/drizzle-orm";
import { NeptuCalculator } from "@neptu/wariga";
import { HeartbeatScheduler, fetchAndStoreCryptoMarketData } from "./colosseum";
import { oracle } from "./routes/oracle";
import { colosseum } from "./routes/colosseum";
import { crypto } from "./routes/crypto";

interface Env {
  DB: D1Database;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_ENDPOINT: string;
  AZURE_OPENAI_DEPLOYMENT: string;
  AZURE_OPENAI_API_VERSION: string;
  ENVIRONMENT: string;
  CACHE: KVNamespace;
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

// Health routes
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

// Daily reading route
app.get("/api/daily/:date", async (c) => {
  const date = c.req.param("date");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }

  const cached = await c.env.CACHE.get(`daily:${date}`);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const db = createDatabase(c.env.DB);
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

// Mount route groups
app.route("/api/oracle", oracle);
app.route("/api/colosseum", colosseum);
app.route("/api/crypto", crypto);

// --- Scheduled helpers ---

async function generateDailyReadings(env: Env): Promise<void> {
  const db = createDatabase(env.DB);
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

async function refreshCryptoMarketData(env: Env): Promise<void> {
  console.log("Refreshing crypto market data from CoinGecko...");
  try {
    const result = await fetchAndStoreCryptoMarketData(env.DB);
    console.log("Crypto market data refresh:", result);
  } catch (error) {
    console.error("Failed to refresh crypto market data:", error);
  }
}

export default {
  fetch: app.fetch,

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const cronPattern = event.cron;

    // Daily task at midnight ("0 0 * * *")
    if (cronPattern === "0 0 * * *") {
      ctx.waitUntil(generateDailyReadings(env));
      ctx.waitUntil(refreshCryptoMarketData(env));
      ctx.waitUntil(runColosseumHeartbeat(env));
      return;
    }

    // Heartbeat cron ("0,33 * * * *")
    const currentMinute = new Date().getMinutes();
    if (currentMinute <= 5) {
      ctx.waitUntil(refreshCryptoMarketData(env));
    }

    ctx.waitUntil(runColosseumHeartbeat(env));
  },
};
