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
    return cacheConn.get(key);
  },

  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void> {
    const ttl = options?.expirationTtl ?? 3600;
    await cacheConn.set(key, value, "EX", ttl);
  },

  async delete(key: string): Promise<void> {
    await cacheConn.del(key);
  },
};
