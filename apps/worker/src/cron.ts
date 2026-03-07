import type { ConnectionOptions } from "bullmq";

import { createLogger } from "@neptu/logger";
import { Queue, Worker, createRedisConnection } from "@neptu/queues";

const log = createLogger({ name: "cron" });

interface CronDeps {
  generateDailyReadings: () => Promise<void>;
  refreshCryptoMarketData: () => Promise<void>;
  cleanupExpiredOAuthTokens: () => Promise<void>;
  retryFailedWebhooks: () => Promise<void>;
  refreshBillionaireList: () => Promise<void>;
  snapshotBillionaires: () => Promise<void>;
  refreshMarketData: () => Promise<void>;
}

const QUEUE_NAME = "neptu-cron";

export async function startCronJobs(deps: CronDeps): Promise<void> {
  const queueConn = createRedisConnection() as unknown as ConnectionOptions;
  const workerConn = createRedisConnection() as unknown as ConnectionOptions;

  const queue = new Queue(QUEUE_NAME, { connection: queueConn });

  // Remove stale repeatable jobs to avoid duplicates on restart
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Drain leftover jobs from previous process to avoid lock errors
  await queue.drain(true);

  // Every 10 min: Refresh crypto market data
  await queue.add(
    "refresh_market",
    {},
    {
      repeat: { pattern: "*/10 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Daily midnight: Generate readings + refresh market data
  await queue.add(
    "daily_tasks",
    {},
    {
      repeat: { pattern: "0 0 * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Every 6 hours: Cleanup expired OAuth tokens
  await queue.add(
    "oauth_token_cleanup",
    {},
    {
      repeat: { pattern: "0 */6 * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Every 5 minutes: Retry failed webhook deliveries
  await queue.add(
    "webhook_retry",
    {},
    {
      repeat: { pattern: "*/5 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Daily at 06:00 UTC: Snapshot billionaire wealth + Neptu scores
  await queue.add(
    "billionaire_snapshot",
    {},
    {
      repeat: { pattern: "0 6 * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Daily at 05:00 UTC: Refresh billionaire person list from Forbes API
  await queue.add(
    "billionaire_list_refresh",
    {},
    {
      repeat: { pattern: "0 5 * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Every 2 hours: Refresh market data (AV free tier = 25 req/day)
  await queue.add(
    "market_refresh",
    {},
    {
      repeat: { pattern: "0 */2 * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Process jobs
  new Worker(
    QUEUE_NAME,
    async (job) => {
      log.info({ job: job.name }, "Processing job");

      switch (job.name) {
        case "refresh_market":
          await deps.refreshCryptoMarketData();
          break;

        case "daily_tasks":
          await deps.generateDailyReadings();
          await deps.refreshCryptoMarketData();
          break;

        case "billionaire_snapshot":
          await deps.snapshotBillionaires();
          break;

        case "billionaire_list_refresh":
          await deps.refreshBillionaireList();
          break;

        case "market_refresh":
          await deps.refreshMarketData();
          break;

        case "oauth_token_cleanup":
          await deps.cleanupExpiredOAuthTokens();
          break;

        case "webhook_retry":
          await deps.retryFailedWebhooks();
          break;
      }
    },
    { connection: workerConn, concurrency: 1, lockDuration: 60_000 }
  );

  log.info("Cron jobs registered (7 repeatable schedules)");
}
