import type { Context, Next } from "hono";

import {
  OAuthTokenService,
  type Database,
  type OAuthTokenPayload,
} from "@neptu/drizzle-orm";
import { AUTH_HEADER, type OAuthScope } from "@neptu/shared";

// ============================================================================
// Types
// ============================================================================

export interface OAuthBearerEnv {
  Variables: {
    db: Database;
    oauthUserId: string | null;
    oauthClientId: string;
    oauthScopes: string[];
  };
}

// ============================================================================
// Middleware
// ============================================================================

export function oauthBearerAuth() {
  return async (
    c: Context<OAuthBearerEnv>,
    next: Next
  ): Promise<Response | void> => {
    const authHeader = c.req.header(AUTH_HEADER);
    if (!authHeader) {
      return c.json(
        {
          error: "invalid_token",
          error_description: "Authorization header required",
        },
        401
      );
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return c.json(
        {
          error: "invalid_token",
          error_description: "Invalid authorization format",
        },
        401
      );
    }

    // Skip API keys (nptu_ prefix) — those are handled by apiKeyAuth
    if (token.startsWith("nptu_")) {
      return c.json(
        {
          error: "invalid_token",
          error_description: "Use API key auth for nptu_ tokens",
        },
        401
      );
    }

    const db = c.get("db") as Database;
    const tokenService = new OAuthTokenService(db);

    let payload: OAuthTokenPayload;
    try {
      payload = tokenService.verifyAccessToken(token);
    } catch {
      return c.json(
        {
          error: "invalid_token",
          error_description: "Invalid or expired token",
        },
        401
      );
    }

    // Check revocation
    const revoked = await tokenService.isTokenRevoked(payload.jti);
    if (revoked) {
      return c.json(
        { error: "invalid_token", error_description: "Token has been revoked" },
        401
      );
    }

    c.set("oauthUserId", payload.sub);
    c.set("oauthClientId", payload.cid);
    c.set("oauthScopes", payload.scope.split(" "));

    await next();
  };
}

export function requireOAuthScope(...requiredScopes: OAuthScope[]) {
  return async (
    c: Context<OAuthBearerEnv>,
    next: Next
  ): Promise<Response | void> => {
    const scopes = c.get("oauthScopes") as string[];

    if (!scopes) {
      return c.json(
        { error: "insufficient_scope", error_description: "Not authenticated" },
        403
      );
    }

    const hasScope = requiredScopes.some((scope) => scopes.includes(scope));

    if (!hasScope) {
      return c.json(
        {
          error: "insufficient_scope",
          error_description: `Required: ${requiredScopes.join(" or ")}`,
        },
        403
      );
    }

    await next();
  };
}
