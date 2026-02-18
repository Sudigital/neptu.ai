import type { Context, Next } from "hono";

import { WALLET_HEADER } from "@neptu/shared";

export interface WalletAuthEnv {
  Variables: {
    walletAddress: string;
  };
}

/**
 * Lightweight wallet authentication middleware for web app routes.
 * Validates the X-Wallet-Address header contains a plausible Solana address.
 *
 * This is used for web-app-facing routes where the user's wallet ownership
 * was already verified client-side by Dynamic SDK. PASETO is reserved
 * exclusively for developer / external API access.
 */
export async function walletAuth(
  c: Context<WalletAuthEnv>,
  next: Next
): Promise<Response | void> {
  const walletAddress = c.req.header(WALLET_HEADER);

  if (!walletAddress) {
    return c.json(
      { success: false, error: "X-Wallet-Address header required" },
      401
    );
  }

  const SOLANA_ADDRESS_MIN_LENGTH = 32;
  const SOLANA_ADDRESS_MAX_LENGTH = 44;

  if (
    walletAddress.length < SOLANA_ADDRESS_MIN_LENGTH ||
    walletAddress.length > SOLANA_ADDRESS_MAX_LENGTH
  ) {
    return c.json(
      { success: false, error: "Invalid wallet address format" },
      400
    );
  }

  c.set("walletAddress", walletAddress);
  await next();
}
