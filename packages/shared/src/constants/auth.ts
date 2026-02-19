// ============================================================================
// Authentication
// ============================================================================

const SECONDS_PER_DAY = 86_400;
const TOKEN_TTL_DAYS = 30;
const NONCE_TTL_MINUTES = 5;
const SECONDS_PER_MINUTE = 60;

/** Access token TTL in seconds (30 days) */
export const AUTH_ACCESS_TOKEN_TTL = (TOKEN_TTL_DAYS *
  SECONDS_PER_DAY) as const;

/** Refresh token TTL in seconds (30 days) */
export const AUTH_REFRESH_TOKEN_TTL = (TOKEN_TTL_DAYS *
  SECONDS_PER_DAY) as const;

/** Nonce TTL in seconds (5 minutes) */
export const AUTH_NONCE_TTL = (NONCE_TTL_MINUTES * SECONDS_PER_MINUTE) as const;

/** Authorization header name */
export const AUTH_HEADER = "Authorization" as const;

/** Wallet address header name */
export const WALLET_HEADER = "X-Wallet-Address" as const;

/** Nonce message template — {nonce} is replaced with the generated nonce */
export const AUTH_NONCE_MESSAGE =
  "Sign this message to verify your wallet ownership for Neptu.\n\nNonce: {nonce}" as const;
