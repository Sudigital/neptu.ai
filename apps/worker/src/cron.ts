import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { createRedisConnection } from "./cache";

interface CronDeps {
  runHeartbeat: (phase: string) => Promise<void>;
  generateDailyReadings: () => Promise<void>;
  refreshCryptoMarketData: () => Promise<void>;
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

  // Every 3 min: Reply to comments
  await queue.add(
    "reply_comments",
    {},
    {
      repeat: { pattern: "*/3 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );

  // Every 5 min: Comment on others + vote at :15,:30,:45
  await queue.add(
    "comment_and_vote",
    {},
    {
      repeat: { pattern: "*/5 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );

  // Every 10 min: Post new thread + other activity + market refresh
  await queue.add(
    "post_and_refresh",
    {},
    {
      repeat: { pattern: "*/10 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );

  // Daily midnight: Generate readings + refresh market data
  await queue.add(
    "daily_tasks",
    {},
    {
      repeat: { pattern: "0 0 * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );

  // Process jobs (single concurrency to avoid duplicate heartbeat runs)
  new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`[BullMQ] Processing ${job.name}`);

      switch (job.name) {
        case "reply_comments":
          await deps.runHeartbeat("reply_comments");
          break;

        case "comment_and_vote":
          await deps.runHeartbeat("comment_others");
          if (new Date().getMinutes() % 15 === 0) {
            await deps.runHeartbeat("vote");
          }
          break;

        case "post_and_refresh": {
          const min = new Date().getMinutes();
          await deps.runHeartbeat("post_thread");
          if (min % 20 === 0) {
            await deps.runHeartbeat("other_activity");
          }
          if (min === 0) {
            await deps.refreshCryptoMarketData();
          }
          break;
        }

        case "daily_tasks":
          await deps.generateDailyReadings();
          await deps.refreshCryptoMarketData();
          break;
      }
    },
    { connection: workerConn, concurrency: 1 },
  );

  console.log("[BullMQ] Cron jobs registered (4 repeatable schedules)");
}
