// ============================================================================
// Authentication
// ============================================================================

/** Access token TTL in seconds (15 minutes) */
export const AUTH_ACCESS_TOKEN_TTL = 900 as const;

/** Refresh token TTL in seconds (7 days) */
export const AUTH_REFRESH_TOKEN_TTL = 604800 as const;

/** Nonce TTL in seconds (5 minutes) */
export const AUTH_NONCE_TTL = 300 as const;

/** Authorization header name */
export const AUTH_HEADER = "Authorization" as const;

/** Wallet address header name */
export const WALLET_HEADER = "X-Wallet-Address" as const;

/** Nonce message template — {nonce} is replaced with the generated nonce */
export const AUTH_NONCE_MESSAGE =
  "Sign this message to verify your wallet ownership for Neptu.\n\nNonce: {nonce}" as const;
