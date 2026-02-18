import { describe, test, expect, beforeAll } from "bun:test";

import { Hono } from "hono";
import { generateKeys } from "paseto-ts/v4";

import { issueTokenPair } from "../src/lib/paseto";
import {
  pasetoAuth,
  requireAdmin,
  type AuthEnv,
} from "../src/middleware/paseto-auth";

// Set up a test PASETO key before running tests
beforeAll(() => {
  const key = generateKeys("local") as string;
  process.env.PASETO_SECRET_KEY = key;
});

const TEST_USER_ID = "middleware-test-user";
const TEST_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

function createTestApp() {
  const app = new Hono<AuthEnv>();

  app.use("/protected/*", pasetoAuth);

  app.get("/protected/profile", (c) =>
    c.json({
      userId: c.get("userId"),
      walletAddress: c.get("walletAddress"),
      role: c.get("role"),
    })
  );

  app.use("/admin/*", pasetoAuth, requireAdmin);

  app.get("/admin/dashboard", (c) =>
    c.json({
      userId: c.get("userId"),
      admin: true,
    })
  );

  return app;
}

describe("pasetoAuth middleware", () => {
  test("should reject requests without Authorization header", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile");

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Authorization header required");
  });

  test("should reject requests with malformed Authorization", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile", {
      headers: { Authorization: "Basic abc123" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid authorization format");
  });

  test("should reject requests with invalid token", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile", {
      headers: { Authorization: "Bearer invalid-token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid or expired token");
  });

  test("should accept requests with valid access token", async () => {
    const app = createTestApp();
    const tokens = await issueTokenPair(TEST_USER_ID, TEST_WALLET, "user");

    const res = await app.request("/protected/profile", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(TEST_USER_ID);
    expect(body.walletAddress).toBe(TEST_WALLET);
    expect(body.role).toBe("user");
  });

  test("should reject refresh token used as access token", async () => {
    const app = createTestApp();
    const tokens = await issueTokenPair(TEST_USER_ID, TEST_WALLET, "user");

    const res = await app.request("/protected/profile", {
      headers: { Authorization: `Bearer ${tokens.refreshToken}` },
    });

    expect(res.status).toBe(401);
  });

  test("should set role=admin for admin users", async () => {
    const app = createTestApp();
    const tokens = await issueTokenPair(TEST_USER_ID, TEST_WALLET, "admin");

    const res = await app.request("/protected/profile", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("admin");
  });
});

describe("requireAdmin middleware", () => {
  test("should reject non-admin users", async () => {
    const app = createTestApp();
    const tokens = await issueTokenPair(TEST_USER_ID, TEST_WALLET, "user");

    const res = await app.request("/admin/dashboard", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Admin access required");
  });

  test("should allow admin users", async () => {
    const app = createTestApp();
    const tokens = await issueTokenPair(TEST_USER_ID, TEST_WALLET, "admin");

    const res = await app.request("/admin/dashboard", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(TEST_USER_ID);
    expect(body.admin).toBe(true);
  });
});
