import { createLogger } from "@neptu/logger";
import IORedis from "ioredis";

const log = createLogger({ name: "redis" });
let connection: IORedis | null = null;

export function createRedisConnection(url?: string): IORedis {
  const conn = new IORedis(
    url ?? process.env.REDIS_URL ?? "redis://localhost:6379",
    {
      maxRetriesPerRequest: null,
    }
  );
  conn.on("error", (err) => log.error({ err }, "Redis connection error"));
  return conn;
}

export function getSharedConnection(): IORedis {
  if (!connection) {
    connection = createRedisConnection();
  }
  return connection;
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
