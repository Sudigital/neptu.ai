import { describe, test, expect } from "bun:test";

import { Hono } from "hono";

import { walletAuth, type WalletAuthEnv } from "../src/middleware/wallet-auth";

const TEST_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

function createTestApp() {
  const app = new Hono<WalletAuthEnv>();

  app.use("/reading/*", walletAuth);

  app.get("/reading/potensi", (c) =>
    c.json({
      walletAddress: c.get("walletAddress"),
      ok: true,
    })
  );

  return app;
}

describe("walletAuth middleware", () => {
  test("should reject requests without X-Wallet-Address header", async () => {
    const app = createTestApp();
    const res = await app.request("/reading/potensi");

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("X-Wallet-Address header required");
  });

  test("should reject wallet address that is too short", async () => {
    const app = createTestApp();
    const res = await app.request("/reading/potensi", {
      headers: { "X-Wallet-Address": "abc" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid wallet address format");
  });

  test("should reject wallet address that is too long", async () => {
    const app = createTestApp();
    const res = await app.request("/reading/potensi", {
      headers: { "X-Wallet-Address": "a".repeat(50) },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid wallet address format");
  });

  test("should accept valid wallet address and set context", async () => {
    const app = createTestApp();
    const res = await app.request("/reading/potensi", {
      headers: { "X-Wallet-Address": TEST_WALLET },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.walletAddress).toBe(TEST_WALLET);
    expect(body.ok).toBe(true);
  });
});
