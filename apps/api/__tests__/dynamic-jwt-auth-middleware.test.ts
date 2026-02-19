import { describe, test, expect, beforeAll } from "bun:test";
import crypto from "crypto";

import { Hono } from "hono";

import { issueTokenPair } from "../src/lib/paseto";
import {
  dynamicJwtAuth,
  type DynamicJwtAuthEnv,
} from "../src/middleware/dynamic-jwt-auth";

// Set up a test JWT secret before running tests
beforeAll(() => {
  process.env.JWT_SECRET = crypto.randomBytes(64).toString("hex");
});

const TEST_USER_ID = "test-user-id-123";
const TEST_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

function createTestApp() {
  const app = new Hono<DynamicJwtAuthEnv>();

  app.use("/protected/*", dynamicJwtAuth);

  app.get("/protected/profile", (c) =>
    c.json({
      dynamicUserId: c.get("dynamicUserId"),
      walletAddress: c.get("walletAddress"),
      ok: true,
    })
  );

  return app;
}

describe("dynamicJwtAuth middleware", () => {
  test("should reject requests with no auth at all", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile");

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Authentication required");
  });

  test("should reject invalid JWT", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile", {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid or expired token");
  });

  test("should reject raw wallet address header (no JWT)", async () => {
    const app = createTestApp();
    const walletAddress = "2VNKqH3aL3xQkZGZ7wj3F6GWZ5E6VSovs3svLesaxwCo";
    const res = await app.request("/protected/profile", {
      headers: { "X-Wallet-Address": walletAddress },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Authentication required");
  });

  test("should reject non-Bearer auth scheme", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile", {
      headers: { Authorization: "Basic abc123" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid Authorization header format");
  });

  test("should reject invalid JWT even with wallet header present", async () => {
    const app = createTestApp();
    const walletAddress = "2VNKqH3aL3xQkZGZ7wj3F6GWZ5E6VSovs3svLesaxwCo";
    const res = await app.request("/protected/profile", {
      headers: {
        Authorization: "Bearer invalid.jwt.token",
        "X-Wallet-Address": walletAddress,
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid or expired token");
  });

  test("should accept valid PASETO access token (session auth)", async () => {
    const app = createTestApp();
    const { accessToken } = issueTokenPair(TEST_USER_ID, TEST_WALLET, "user");
    const res = await app.request("/protected/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dynamicUserId).toBe(TEST_USER_ID);
    expect(body.walletAddress).toBe(TEST_WALLET);
    expect(body.ok).toBe(true);
  });

  test("should reject refresh token used as access token", async () => {
    const app = createTestApp();
    const { refreshToken } = issueTokenPair(TEST_USER_ID, TEST_WALLET, "user");
    const res = await app.request("/protected/profile", {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid or expired token");
  });
});
