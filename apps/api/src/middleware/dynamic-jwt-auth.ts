import type { Context, Next } from "hono";

import { createLogger } from "@neptu/logger";
import { AUTH_HEADER, WALLET_HEADER } from "@neptu/shared";

import { extractWalletAddress, verifyDynamicJwt } from "../lib/dynamic-jwt";

const log = createLogger({ name: "auth-middleware" });

const SOLANA_ADDRESS_MIN_LENGTH = 32;
const SOLANA_ADDRESS_MAX_LENGTH = 44;

export interface DynamicJwtAuthEnv {
  Variables: {
    dynamicUserId: string;
    walletAddress: string;
  };
}

/**
 * Unified authentication middleware for web app routes.
 *
 * Accepts two authentication methods (checked in order):
 * 1. Authorization: Bearer <jwt> — Dynamic Labs JWT verified via JWKS
 * 2. X-Wallet-Address: <address> — Wallet address header (connect-only mode)
 *
 * Wallet ownership is verified client-side by Dynamic SDK.
 * Both methods set walletAddress in context for downstream handlers.
 */
export async function dynamicJwtAuth(
  c: Context<DynamicJwtAuthEnv>,
  next: Next
): Promise<Response | void> {
  // Strategy 1: Dynamic JWT (preferred when available)
  const authHeader = c.req.header(AUTH_HEADER);
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token) {
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
        await next();
        return;
      } catch (err) {
        log.debug({ err }, "JWT verification failed, trying wallet header");
      }
    }
  }

  // Strategy 2: Wallet address header (connect-only mode)
  const walletAddress = c.req.header(WALLET_HEADER);
  if (walletAddress) {
    if (
      walletAddress.length < SOLANA_ADDRESS_MIN_LENGTH ||
      walletAddress.length > SOLANA_ADDRESS_MAX_LENGTH
    ) {
      return c.json(
        { success: false, error: "Invalid wallet address format" },
        400
      );
    }

    c.set("dynamicUserId", "");
    c.set("walletAddress", walletAddress);
    await next();
    return;
  }

  return c.json(
    {
      success: false,
      error:
        "Authentication required. Send Authorization header or X-Wallet-Address header.",
    },
    401
  );
}
