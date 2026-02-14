import IORedis from "ioredis";

export interface CacheStore {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Create a new IORedis connection.
 * BullMQ requires `maxRetriesPerRequest: null`.
 * Each Queue / Worker needs its own connection instance.
 */
export function createRedisConnection(): IORedis {
  const conn = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  conn.on("error", (err) => console.error("[Redis]", err));
  return conn;
}

const cacheConn = createRedisConnection();

export const redisCache: CacheStore = {
  async get(key: string): Promise<string | null> {
    return cacheConn.get(key);
  },

  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void> {
    const ttl = options?.expirationTtl ?? 3600;
    await cacheConn.set(key, value, "EX", ttl);
  },

  async delete(key: string): Promise<void> {
    await cacheConn.del(key);
  },
};
