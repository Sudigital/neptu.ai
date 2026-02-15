import { createLogger, type Logger } from "@neptu/logger";
import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";

import { createRedisConnection } from "./connection";

export interface QueueWorkerOptions<T> {
  name: string;
  concurrency?: number;
  processor: (job: Job<T>) => Promise<void>;
}

export interface QueueManagerOptions {
  concurrency?: number;
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private logger: Logger;
  private concurrency: number;

  constructor(options: QueueManagerOptions = {}) {
    this.concurrency = options.concurrency ?? 5;
    this.logger = createLogger({ name: "QueueManager" });
  }

  registerWorker<T>(options: QueueWorkerOptions<T>): void {
    const { name, processor } = options;
    const concurrency = options.concurrency ?? this.concurrency;

    const queueConn = createRedisConnection() as unknown as ConnectionOptions;
    const workerConn = createRedisConnection() as unknown as ConnectionOptions;

    const queue = new Queue(name, { connection: queueConn });
    this.queues.set(name, queue);

    const workerLogger = createLogger({ name });

    const worker = new Worker<T>(
      name,
      async (job) => {
        try {
          await processor(job);
        } catch (error) {
          workerLogger.error(`Job ${job.id} failed: ${error}`);
          throw error;
        }
      },
      { connection: workerConn, concurrency }
    );

    worker.on("ready", () => {
      workerLogger.info(`${name} worker: listening`);
    });

    worker.on("completed", (job) => {
      workerLogger.debug(`Job ${job.id} completed`);
    });

    worker.on("failed", (job, error) => {
      workerLogger.error(`Job ${job?.id} failed: ${error.message}`);
    });

    this.workers.set(name, worker);
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  async addJob<T>(
    queueName: string,
    data: T,
    options?: { delay?: number; priority?: number }
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    const job = await queue.add(queueName, data, options);
    return job.id ?? "";
  }

  async addCronJob(
    queueName: string,
    jobName: string,
    pattern: string,
    data: Record<string, unknown> = {}
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.add(jobName, data, {
      repeat: { pattern },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async clearRepeatableJobs(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  async close(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.workers.clear();
    this.queues.clear();
  }

  logStartup(appName: string): void {
    this.logger.info(`🚀 Starting ${appName}...`);
    this.logger.info(
      `✅ All workers started with concurrency: ${this.concurrency}`
    );
  }
}

export function createQueueManager(
  options?: QueueManagerOptions
): QueueManager {
  return new QueueManager(options);
}
