import { describe, test, expect } from "bun:test";

import { Hono } from "hono";

import {
  dynamicJwtAuth,
  type DynamicJwtAuthEnv,
} from "../src/middleware/dynamic-jwt-auth";

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

  test("should reject invalid JWT and no wallet header fallback", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile", {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Authentication required");
  });

  test("should accept valid wallet address header", async () => {
    const app = createTestApp();
    const walletAddress = "2VNKqH3aL3xQkZGZ7wj3F6GWZ5E6VSovs3svLesaxwCo";
    const res = await app.request("/protected/profile", {
      headers: { "X-Wallet-Address": walletAddress },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.walletAddress).toBe(walletAddress);
    expect(body.ok).toBe(true);
  });

  test("should reject wallet address that is too short", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile", {
      headers: { "X-Wallet-Address": "short" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid wallet address format");
  });

  test("should reject non-Bearer auth scheme without wallet fallback", async () => {
    const app = createTestApp();
    const res = await app.request("/protected/profile", {
      headers: { Authorization: "Basic abc123" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Authentication required");
  });

  test("should prefer wallet header when JWT is invalid", async () => {
    const app = createTestApp();
    const walletAddress = "2VNKqH3aL3xQkZGZ7wj3F6GWZ5E6VSovs3svLesaxwCo";
    const res = await app.request("/protected/profile", {
      headers: {
        Authorization: "Bearer invalid.jwt.token",
        "X-Wallet-Address": walletAddress,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.walletAddress).toBe(walletAddress);
    expect(body.ok).toBe(true);
  });
});
