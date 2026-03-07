import { createLogger } from "@neptu/logger";
import { createRedisConnection } from "@neptu/queues";

const log = createLogger({ name: "cache" });

export interface CacheStore {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

const cacheConn = createRedisConnection();
cacheConn.on("error", (err) => log.error({ err }, "Redis connection error"));

export const redisCache: CacheStore = {
  async get(key: string): Promise<string | null> {
    try {
      return await cacheConn.get(key);
    } catch {
      log.warn("Cache get failed for key=%s, skipping", key);
      return null;
    }
  },

  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void> {
    try {
      const ttl = options?.expirationTtl ?? 3600;
      await cacheConn.set(key, value, "EX", ttl);
    } catch {
      log.warn("Cache put failed for key=%s, skipping", key);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await cacheConn.del(key);
    } catch {
      log.warn("Cache delete failed for key=%s, skipping", key);
    }
  },
};
