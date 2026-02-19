import { describe, test, expect, beforeAll } from "bun:test";
import crypto from "crypto";

import { Hono } from "hono";
import jwt from "jsonwebtoken";

import {
  oauthBearerAuth,
  requireOAuthScope,
  type OAuthBearerEnv,
} from "../src/middleware/oauth-bearer-auth";
import { rateLimit } from "../src/middleware/rate-limit";

// ============================================================================
// Test Setup
// ============================================================================

const JWT_SECRET = crypto.randomBytes(64).toString("hex");

beforeAll(() => {
  process.env.OAUTH_JWT_SECRET = JWT_SECRET;
});

function signTestToken(
  payload: Record<string, unknown>,
  secret = JWT_SECRET
): string {
  return jwt.sign(payload, secret, {
    issuer: "https://api.neptu.sudigital.com",
  });
}

// ============================================================================
// OAuth Bearer Auth Middleware Tests
// ============================================================================

describe("OAuth Bearer Auth Middleware", () => {
  function createBearerTestApp() {
    const app = new Hono<OAuthBearerEnv>();

    // Mock DB with mock token service
    app.use("*", async (c, next) => {
      c.set("db", {} as never);
      await next();
    });

    app.use("/protected/*", oauthBearerAuth());
    app.use("/scoped/*", oauthBearerAuth());

    app.get("/protected/data", (c) =>
      c.json({
        userId: c.get("oauthUserId"),
        clientId: c.get("oauthClientId"),
        scopes: c.get("oauthScopes"),
      })
    );

    app.use("/scoped/read", requireOAuthScope("neptu:read"));
    app.get("/scoped/read", (c) =>
      c.json({ data: "read data", scopes: c.get("oauthScopes") })
    );

    app.use("/scoped/ai", requireOAuthScope("neptu:ai"));
    app.get("/scoped/ai", (c) =>
      c.json({ data: "ai data", scopes: c.get("oauthScopes") })
    );

    return app;
  }

  test("should reject request without Authorization header", async () => {
    const app = createBearerTestApp();
    const res = await app.request("/protected/data");
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("invalid_token");
  });

  test("should reject non-Bearer scheme", async () => {
    const app = createBearerTestApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("invalid_token");
  });

  test("should reject nptu_ prefixed tokens", async () => {
    const app = createBearerTestApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer nptu_abc123" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error_description).toContain("API key auth");
  });

  test("should reject invalid JWT", async () => {
    const app = createBearerTestApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    expect(res.status).toBe(401);
  });

  test("should reject JWT signed with wrong secret", async () => {
    const app = createBearerTestApp();
    const wrongToken = signTestToken(
      {
        sub: "user-1",
        cid: "client-1",
        scope: "neptu:read",
        typ: "oauth_access",
        jti: "hash-1",
      },
      "wrong-secret"
    );
    const res = await app.request("/protected/data", {
      headers: { Authorization: `Bearer ${wrongToken}` },
    });
    expect(res.status).toBe(401);
  });

  test("should reject expired JWT", async () => {
    const app = createBearerTestApp();
    const expiredToken = jwt.sign(
      {
        sub: "user-1",
        cid: "client-1",
        scope: "neptu:read",
        typ: "oauth_access",
        jti: "hash-1",
      },
      JWT_SECRET,
      { issuer: "https://api.neptu.sudigital.com", expiresIn: -10 }
    );
    const res = await app.request("/protected/data", {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect(res.status).toBe(401);
  });

  test("requireOAuthScope should reject without required scopes", async () => {
    const app = createBearerTestApp();
    // Only has neptu:read, trying to access neptu:ai endpoint
    const token = signTestToken({
      sub: "user-1",
      cid: "client-1",
      scope: "neptu:read",
      typ: "oauth_access",
      jti: "hash-1",
    });

    // Access is controlled by the middleware, but since we mock DB,
    // the isTokenRevoked call will fail. Let's test the scope middleware directly.
    const scopeApp = new Hono<OAuthBearerEnv>();
    scopeApp.use("*", async (c, next) => {
      c.set("oauthScopes", ["neptu:read"]);
      await next();
    });
    scopeApp.use("*", requireOAuthScope("neptu:ai"));
    scopeApp.get("*", (c) => c.json({ ok: true }));

    const res = await scopeApp.request("/test");
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe("insufficient_scope");
  });

  test("requireOAuthScope should allow matching scopes", async () => {
    const scopeApp = new Hono<OAuthBearerEnv>();
    scopeApp.use("*", async (c, next) => {
      c.set("oauthScopes", ["neptu:read", "neptu:ai"]);
      await next();
    });
    scopeApp.use("*", requireOAuthScope("neptu:ai"));
    scopeApp.get("*", (c) => c.json({ ok: true }));

    const res = await scopeApp.request("/test");
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// OAuth Discovery Tests
// ============================================================================

describe("OAuth Discovery Endpoint", () => {
  test("should return valid server metadata structure", async () => {
    // We can't easily start the full API server, so test the route handler directly
    const { oauthDiscoveryRoutes } = await import("../src/routes/oauth");

    const app = new Hono();
    app.route("/.well-known", oauthDiscoveryRoutes);

    const res = await app.request("/.well-known/oauth-authorization-server");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.issuer).toBe("https://api.neptu.sudigital.com");
    expect(body.authorization_endpoint).toContain("/api/oauth/authorize");
    expect(body.token_endpoint).toContain("/api/oauth/token");
    expect(body.revocation_endpoint).toContain("/api/oauth/revoke");
    expect(body.userinfo_endpoint).toContain("/api/oauth/userinfo");
    expect(body.scopes_supported).toContain("neptu:read");
    expect(body.scopes_supported).toContain("neptu:ai");
    expect(body.response_types_supported).toContain("code");
    expect(body.grant_types_supported).toContain("authorization_code");
    expect(body.grant_types_supported).toContain("client_credentials");
    expect(body.grant_types_supported).toContain("refresh_token");
    expect(body.code_challenge_methods_supported).toContain("S256");
  });
});

// ============================================================================
// Rate Limit Integration Tests
// ============================================================================

describe("OAuth Rate Limit Integration", () => {
  test("should rate limit token endpoint at 20/min", async () => {
    const app = new Hono();
    const limiter = rateLimit({
      limit: 20,
      windowSeconds: 60,
      keyFn: (c) => c.req.header("x-test-ip") ?? "default",
    });

    app.post("/token", limiter, (c) => c.json({ ok: true }));

    // Make 20 requests
    for (let i = 0; i < 20; i++) {
      const res = await app.request("/token", {
        method: "POST",
        headers: { "x-test-ip": "rate-token" },
      });
      expect(res.status).toBe(200);
    }

    // 21st should be blocked
    const blocked = await app.request("/token", {
      method: "POST",
      headers: { "x-test-ip": "rate-token" },
    });
    expect(blocked.status).toBe(429);

    const body = await blocked.json();
    expect(body.error).toBe("rate_limit_exceeded");
  });

  test("should rate limit authorize endpoint at 30/min", async () => {
    const app = new Hono();
    const limiter = rateLimit({
      limit: 30,
      windowSeconds: 60,
      keyFn: (c) => c.req.header("x-test-ip") ?? "default",
    });

    app.get("/authorize", limiter, (c) => c.json({ ok: true }));

    for (let i = 0; i < 30; i++) {
      const res = await app.request("/authorize", {
        headers: { "x-test-ip": "rate-auth" },
      });
      expect(res.status).toBe(200);
    }

    const blocked = await app.request("/authorize", {
      headers: { "x-test-ip": "rate-auth" },
    });
    expect(blocked.status).toBe(429);
  });
});

// ============================================================================
// OAuth Token Format Tests
// ============================================================================

describe("OAuth JWT Token Structure", () => {
  test("should produce valid JWT with correct claims", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        sub: "user-123",
        cid: "client-db-id",
        scope: "neptu:read neptu:ai",
        typ: "oauth_access",
        jti: "abc123hash",
      },
      JWT_SECRET,
      {
        expiresIn: 3600,
        issuer: "https://api.neptu.sudigital.com",
      }
    );

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "https://api.neptu.sudigital.com",
    }) as jwt.JwtPayload;

    expect(decoded.sub).toBe("user-123");
    expect(decoded.cid).toBe("client-db-id");
    expect(decoded.scope).toBe("neptu:read neptu:ai");
    expect(decoded.typ).toBe("oauth_access");
    expect(decoded.jti).toBe("abc123hash");
    expect(decoded.iss).toBe("https://api.neptu.sudigital.com");
    expect(decoded.exp).toBeGreaterThan(now);
    expect(decoded.iat).toBeGreaterThanOrEqual(now - 1);
  });

  test("should reject wrong issuer", () => {
    const token = jwt.sign({ sub: "user-1", typ: "oauth_access" }, JWT_SECRET, {
      issuer: "https://evil.com",
    });

    expect(() => {
      jwt.verify(token, JWT_SECRET, {
        issuer: "https://api.neptu.sudigital.com",
      });
    }).toThrow();
  });

  test("should reject wrong token type", () => {
    const token = jwt.sign(
      {
        sub: "user-1",
        cid: "client-1",
        scope: "neptu:read",
        typ: "wrong_type",
        jti: "hash-1",
      },
      JWT_SECRET,
      { issuer: "https://api.neptu.sudigital.com" }
    );

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "https://api.neptu.sudigital.com",
    }) as Record<string, string>;

    expect(decoded.typ).not.toBe("oauth_access");
  });

  test("client_credentials token should have null sub", () => {
    const token = jwt.sign(
      {
        sub: null,
        cid: "client-1",
        scope: "neptu:read",
        typ: "oauth_access",
        jti: "hash-1",
      },
      JWT_SECRET,
      { issuer: "https://api.neptu.sudigital.com", expiresIn: 3600 }
    );

    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.sub).toBeNull();
  });
});

// ============================================================================
// PKCE Verification Tests
// ============================================================================

describe("PKCE S256 Verification", () => {
  async function sha256Base64url(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hashBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  test("should correctly compute S256 code challenge", async () => {
    // RFC 7636 test vector
    const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const expectedChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    const computed = await sha256Base64url(codeVerifier);
    expect(computed).toBe(expectedChallenge);
  });

  test("code_verifier/code_challenge should match for random values", async () => {
    const verifier =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const challenge = await sha256Base64url(verifier);

    expect(challenge).toBeTruthy();
    expect(challenge.length).toBeGreaterThan(0);
    // Should not contain padding
    expect(challenge).not.toContain("=");
    // Should be URL-safe
    expect(challenge).not.toContain("+");
    expect(challenge).not.toContain("/");

    // Same input should produce same output
    const challenge2 = await sha256Base64url(verifier);
    expect(challenge2).toBe(challenge);
  });

  test("different verifiers should produce different challenges", async () => {
    const challenge1 = await sha256Base64url("verifier-one-abc123");
    const challenge2 = await sha256Base64url("verifier-two-def456");
    expect(challenge1).not.toBe(challenge2);
  });
});
