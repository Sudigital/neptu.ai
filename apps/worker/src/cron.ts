import type { ConnectionOptions } from "bullmq";

import { createLogger } from "@neptu/logger";
import { Queue, Worker, createRedisConnection } from "@neptu/queues";

const log = createLogger({ name: "cron" });

interface CronDeps {
  generateDailyReadings: () => Promise<void>;
  refreshCryptoMarketData: () => Promise<void>;
  cleanupExpiredOAuthTokens: () => Promise<void>;
  retryFailedWebhooks: () => Promise<void>;
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

        case "oauth_token_cleanup":
          await deps.cleanupExpiredOAuthTokens();
          break;

        case "webhook_retry":
          await deps.retryFailedWebhooks();
          break;
      }
    },
    { connection: workerConn, concurrency: 1 }
  );

  log.info("Cron jobs registered (4 repeatable schedules)");
}
