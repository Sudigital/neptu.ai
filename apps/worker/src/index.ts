import {
  createDatabase,
  DailyReadingService,
  OAuthCleanupService,
  OAuthWebhookService,
} from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import { CORS_ALLOWED_ORIGINS } from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";
/** Neptu Worker - Main entry point */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

import { redisCache } from "./cache";
import { startCronJobs } from "./cron";
import { fetchAndStoreCryptoMarketData } from "./crypto-market-fetcher";
import { crypto } from "./routes/crypto";
import { oracle } from "./routes/oracle";

const log = createLogger({ name: "worker" });
const db = createDatabase();
const app = new Hono();

app.use("*", honoLogger());
app.use(
  "*",
  cors({
    origin: [...CORS_ALLOWED_ORIGINS],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
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
app.route("/api/crypto", crypto);

// Global error handler
app.onError((err, c) => {
  log.error(
    { method: c.req.method, path: c.req.path, stack: err.stack },
    err.message
  );
  return c.json(
    {
      success: false,
      error: "Internal Server Error",
      message: err.message,
    },
    500
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

async function refreshCryptoMarketData(): Promise<void> {
  log.info("Refreshing crypto market data from CoinGecko...");
  try {
    const result = await fetchAndStoreCryptoMarketData(db);
    log.info({ result }, "Crypto market data refreshed");
  } catch (error) {
    log.error({ error }, "Failed to refresh crypto market data");
  }
}

async function cleanupExpiredOAuthTokens(): Promise<void> {
  log.info("Cleaning up expired OAuth tokens...");
  try {
    const cleanupService = new OAuthCleanupService(db);
    const result = await cleanupService.cleanupExpiredTokens();
    log.info(
      {
        accessTokens: result.expiredAccessTokens,
        refreshTokens: result.expiredRefreshTokens,
      },
      `OAuth cleanup completed: ${result.totalCleaned} tokens removed`
    );
  } catch (error) {
    log.error({ error }, "Failed to cleanup OAuth tokens");
  }
}

async function retryFailedWebhooks(): Promise<void> {
  log.info("Retrying failed webhook deliveries...");
  try {
    const webhookService = new OAuthWebhookService(db);
    const retried = await webhookService.retryFailedDeliveries();
    const cleaned = await webhookService.cleanupOldDeliveries(30);
    log.info(
      { retried, cleaned },
      `Webhook retry: ${retried} retried, ${cleaned} old deliveries cleaned`
    );
  } catch (error) {
    log.error({ error }, "Failed to retry webhook deliveries");
  }
}

// Start BullMQ cron jobs
await startCronJobs({
  generateDailyReadings: () => generateDailyReadings(),
  refreshCryptoMarketData: () => refreshCryptoMarketData(),
  cleanupExpiredOAuthTokens: () => cleanupExpiredOAuthTokens(),
  retryFailedWebhooks: () => retryFailedWebhooks(),
});

const port = Number(process.env.WORKER_PORT || process.env.PORT || 8787);
log.info({ port }, "🚀 Neptu Worker started");
Bun.serve({ fetch: app.fetch, port });
