import type { Context, Next } from "hono";

import { createLogger } from "@neptu/logger";
import { AUTH_HEADER } from "@neptu/shared";

import { extractWalletAddress, verifyDynamicJwt } from "../lib/dynamic-jwt";
import { verifyAccessToken } from "../lib/paseto";

const log = createLogger({ name: "auth-middleware" });

export interface DynamicJwtAuthEnv {
  Variables: {
    dynamicUserId: string;
    walletAddress: string;
  };
}

/**
 * Authentication middleware for web and mobile app routes.
 *
 * Accepts two token types via Authorization: Bearer <token>:
 *   1. Dynamic Labs JWT (RS256, verified via JWKS) — used by web app
 *   2. PASETO/HS256 access token (from /auth/session) — used by mobile app
 *
 * Wallet address is always extracted from the verified token payload,
 * never trusted from an unauthenticated header.
 */
export async function dynamicJwtAuth(
  c: Context<DynamicJwtAuthEnv>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header(AUTH_HEADER);

  if (!authHeader) {
    return c.json(
      {
        success: false,
        error:
          "Authentication required. Send Authorization: Bearer <jwt> header.",
      },
      401
    );
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return c.json(
      {
        success: false,
        error: "Invalid Authorization header format. Expected: Bearer <jwt>",
      },
      401
    );
  }

  // Strategy 1: Try Dynamic Labs JWT (RS256 via JWKS)
  try {
    const payload = await verifyDynamicJwt(token);
    const walletAddress = extractWalletAddress(payload);

    if (!walletAddress) {
      return c.json(
        { success: false, error: "No wallet address found in JWT" },
        401
      );
    }

    c.set("dynamicUserId", payload.sub);
    c.set("walletAddress", walletAddress);
    return next();
  } catch {
    // Not a Dynamic JWT — try PASETO next
  }

  // Strategy 2: Try our own HS256 access token (from /auth/session)
  try {
    const payload = verifyAccessToken(token);

    c.set("dynamicUserId", payload.sub);
    c.set("walletAddress", payload.wal);
    return next();
  } catch (err) {
    log.warn({ err }, "All token verification strategies failed");
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }
}
