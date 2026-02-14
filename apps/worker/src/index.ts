/** Neptu Worker - Main entry point */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDatabase, DailyReadingService } from "@neptu/drizzle-orm";
import { NeptuCalculator } from "@neptu/wariga";
import { CORS_ALLOWED_ORIGINS } from "@neptu/shared";
import { HeartbeatScheduler, fetchAndStoreCryptoMarketData } from "./colosseum";
import { oracle } from "./routes/oracle";
import { colosseum } from "./routes/colosseum";
import { crypto } from "./routes/crypto";
import { redisCache } from "./cache";
import { startCronJobs } from "./cron";

const db = createDatabase();
const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [...CORS_ALLOWED_ORIGINS],
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
    environment: process.env.ENVIRONMENT,
  });
});

// Daily reading route
app.get("/api/daily/:date", async (c) => {
  const date = c.req.param("date");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }

  const cached = await redisCache.get(`daily:${date}`);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const dailyService = new DailyReadingService(db);
  const reading = await dailyService.getDailyReading({ date, type: "peluang" });

  if (!reading) {
    return c.json({ error: "Daily reading not found" }, 404);
  }

  await redisCache.put(`daily:${date}`, JSON.stringify(reading), {
    expirationTtl: 86400,
  });

  return c.json(reading);
});

// Mount route groups
app.route("/api/oracle", oracle);
app.route("/api/colosseum", colosseum);
app.route("/api/crypto", crypto);

// Global error handler
app.onError((err, c) => {
  console.error(
    `[Worker Error] ${c.req.method} ${c.req.path}:`,
    err.message,
    err.stack,
  );
  return c.json(
    {
      success: false,
      error: "Internal Server Error",
      message: err.message,
    },
    500,
  );
});

// --- Scheduled helpers ---

async function generateDailyReadings(): Promise<void> {
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

async function runColosseumHeartbeat(
  phase:
    | "reply_comments"
    | "comment_others"
    | "post_thread"
    | "vote"
    | "other_activity" = "reply_comments",
): Promise<void> {
  if (!process.env.COLOSSEUM_API_KEY) {
    console.log("Colosseum API key not configured, skipping heartbeat");
    return;
  }

  const heartbeat = new HeartbeatScheduler({
    COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY,
    COLOSSEUM_AGENT_ID: process.env.COLOSSEUM_AGENT_ID!,
    COLOSSEUM_AGENT_NAME: process.env.COLOSSEUM_AGENT_NAME!,
    CACHE: redisCache,
  });

  try {
    const result = await heartbeat.runHeartbeat(phase);
    console.log(
      `Heartbeat [${phase}] completed:`,
      JSON.stringify(result, null, 2),
    );
  } catch (error) {
    console.error(`Heartbeat [${phase}] failed:`, error);
  }
}

async function refreshCryptoMarketData(): Promise<void> {
  console.log("Refreshing crypto market data from CoinGecko...");
  try {
    const result = await fetchAndStoreCryptoMarketData(db);
    console.log("Crypto market data refresh:", result);
  } catch (error) {
    console.error("Failed to refresh crypto market data:", error);
  }
}

// Start BullMQ cron jobs
await startCronJobs({
  runHeartbeat: (phase) =>
    runColosseumHeartbeat(
      phase as
        | "reply_comments"
        | "comment_others"
        | "post_thread"
        | "vote"
        | "other_activity",
    ),
  generateDailyReadings: () => generateDailyReadings(),
  refreshCryptoMarketData: () => refreshCryptoMarketData(),
});

const port = Number(process.env.PORT || 8080);
console.log(`Neptu Worker running on port ${port}`);
Bun.serve({ fetch: app.fetch, port });
