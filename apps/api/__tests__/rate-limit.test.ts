import { describe, test, expect } from "bun:test";

import { Hono } from "hono";

import { rateLimit } from "../src/middleware/rate-limit";

function createTestApp(limit: number, windowSeconds: number) {
  const app = new Hono();

  app.use(
    "*",
    rateLimit({
      limit,
      windowSeconds,
      keyFn: (c) => c.req.header("x-test-ip") ?? "default",
    })
  );

  app.get("/test", (c) => c.json({ ok: true }));

  return app;
}

describe("Rate Limit Middleware", () => {
  test("should allow requests within the limit", async () => {
    const app = createTestApp(5, 60);

    for (let i = 0; i < 5; i++) {
      const res = await app.request("/test", {
        headers: { "x-test-ip": "192.168.1.1" },
      });
      expect(res.status).toBe(200);
    }
  });

  test("should return 429 when limit is exceeded", async () => {
    const app = createTestApp(3, 60);

    // Make 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const res = await app.request("/test", {
        headers: { "x-test-ip": "192.168.1.2" },
      });
      expect(res.status).toBe(200);
    }

    // 4th request should be rate limited
    const res = await app.request("/test", {
      headers: { "x-test-ip": "192.168.1.2" },
    });
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toBe("rate_limit_exceeded");
    expect(body.retry_after).toBeGreaterThan(0);
  });

  test("should set rate limit headers on success", async () => {
    const app = createTestApp(10, 60);

    const res = await app.request("/test", {
      headers: { "x-test-ip": "192.168.1.3" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("9");
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  test("should set Retry-After and rate limit headers on 429", async () => {
    const app = createTestApp(1, 60);

    // Exhaust the limit
    await app.request("/test", {
      headers: { "x-test-ip": "192.168.1.4" },
    });

    const res = await app.request("/test", {
      headers: { "x-test-ip": "192.168.1.4" },
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  test("should track different IPs independently", async () => {
    const app = createTestApp(2, 60);

    // IP A: 2 requests (at limit)
    for (let i = 0; i < 2; i++) {
      const res = await app.request("/test", {
        headers: { "x-test-ip": "10.0.0.1" },
      });
      expect(res.status).toBe(200);
    }

    // IP A: 3rd should be blocked
    const blockedRes = await app.request("/test", {
      headers: { "x-test-ip": "10.0.0.1" },
    });
    expect(blockedRes.status).toBe(429);

    // IP B: should still be allowed
    const otherRes = await app.request("/test", {
      headers: { "x-test-ip": "10.0.0.2" },
    });
    expect(otherRes.status).toBe(200);
  });

  test("should decrement remaining count correctly", async () => {
    const app = createTestApp(5, 60);

    for (let i = 0; i < 5; i++) {
      const res = await app.request("/test", {
        headers: { "x-test-ip": "192.168.1.5" },
      });
      expect(res.headers.get("X-RateLimit-Remaining")).toBe(
        String(5 - (i + 1))
      );
    }
  });

  test("should return OAuth2-compatible error format", async () => {
    const app = createTestApp(1, 60);

    await app.request("/test", {
      headers: { "x-test-ip": "192.168.1.6" },
    });

    const res = await app.request("/test", {
      headers: { "x-test-ip": "192.168.1.6" },
    });
    const body = await res.json();

    expect(body).toHaveProperty("error", "rate_limit_exceeded");
    expect(body).toHaveProperty("error_description");
    expect(body).toHaveProperty("retry_after");
  });
});
