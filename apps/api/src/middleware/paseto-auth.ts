import type { Context, Next } from "hono";

import { AUTH_HEADER } from "@neptu/shared";

import { verifyAccessToken } from "../lib/paseto";

// ============================================================================
// Types
// ============================================================================

export interface AuthEnv {
  Variables: {
    userId: string;
    walletAddress: string;
    isAdmin: boolean;
  };
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * PASETO v4.local authentication middleware.
 * Verifies Bearer token from Authorization header, sets userId,
 * walletAddress, and isAdmin on the Hono context.
 */
export async function pasetoAuth(
  c: Context<AuthEnv>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header(AUTH_HEADER);
  if (!authHeader) {
    return c.json(
      { success: false, error: "Authorization header required" },
      401
    );
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return c.json(
      {
        success: false,
        error: "Invalid authorization format. Use: Bearer <token>",
      },
      401
    );
  }

  try {
    const payload = verifyAccessToken(token);

    c.set("userId", payload.sub);
    c.set("walletAddress", payload.wal);
    c.set("isAdmin", payload.adm);

    await next();
  } catch {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }
}

/**
 * Require the authenticated user to be an admin.
 * Must be used AFTER pasetoAuth.
 */
export async function requireAdmin(
  c: Context<AuthEnv>,
  next: Next
): Promise<Response | void> {
  const isAdmin = c.get("isAdmin");

  if (!isAdmin) {
    return c.json({ success: false, error: "Admin access required" }, 403);
  }

  await next();
}
