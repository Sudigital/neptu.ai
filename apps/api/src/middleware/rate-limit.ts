import type { Context, Next } from "hono";

// ============================================================================
// In-memory sliding window rate limiter (IP-based)
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes
const MAX_ENTRIES = 50_000;

export interface RateLimitOptions {
  /** Maximum requests per window */
  limit: number;
  /** Window duration in seconds (default 60) */
  windowSeconds?: number;
  /** Custom key extractor — defaults to client IP */
  keyFn?: (c: Context) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { limit, windowSeconds = 60 } = options;
  const windowMs = windowSeconds * 1000;
  const records = new Map<string, RateLimitRecord>();
  let lastCleanup = Date.now();

  function cleanup(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, record] of records) {
      if (now > record.resetAt) {
        records.delete(key);
      }
    }

    // Hard cap to prevent memory leak
    if (records.size > MAX_ENTRIES) {
      const entries = [...records.entries()];
      entries
        .sort((a, b) => a[1].resetAt - b[1].resetAt)
        .slice(0, records.size - MAX_ENTRIES)
        .forEach(([key]) => records.delete(key));
    }
  }

  function getClientIp(c: Context): string {
    return (
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown"
    );
  }

  return async (c: Context, next: Next): Promise<Response | void> => {
    const now = Date.now();
    cleanup(now);

    const key = options.keyFn ? options.keyFn(c) : getClientIp(c);
    let record = records.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      records.set(key, record);
    }

    record.count++;

    // Set standard rate limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
    c.header("X-RateLimit-Limit", String(limit));
    c.header(
      "X-RateLimit-Remaining",
      String(Math.max(0, limit - record.count))
    );
    c.header("X-RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));

    if (record.count > limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));

      return c.json(
        {
          error: "rate_limit_exceeded",
          error_description: `Too many requests. Try again in ${retryAfter}s.`,
          retry_after: retryAfter,
        },
        429
      );
    }

    await next();
  };
}
