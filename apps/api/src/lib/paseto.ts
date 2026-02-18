import { AUTH_ACCESS_TOKEN_TTL, AUTH_REFRESH_TOKEN_TTL } from "@neptu/shared";
import { encrypt, decrypt, generateKeys } from "paseto-ts/v4";

// ============================================================================
// Types
// ============================================================================

export interface TokenPayload {
  /** User ID (database primary key) */
  sub: string;
  /** Wallet address */
  wal: string;
  /** Whether user is admin */
  adm: boolean;
  /** Token type: "access" or "refresh" */
  typ: "access" | "refresh";
}

export interface AccessTokenPayload extends TokenPayload {
  typ: "access";
}

export interface RefreshTokenPayload extends TokenPayload {
  typ: "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// Key Management
// ============================================================================

let symmetricKey: string | null = null;

function getSymmetricKey(): string {
  if (symmetricKey) return symmetricKey;

  const envKey = process.env.PASETO_SECRET_KEY;
  if (!envKey) {
    throw new Error(
      "PASETO_SECRET_KEY is required. Generate one with: " +
        "bun -e \"import{generateKeys}from'paseto-ts/v4';console.log(generateKeys('local'))\""
    );
  }

  // Validate PASERK format: k4.local.<base64url>
  if (!envKey.startsWith("k4.local.")) {
    throw new Error(
      "PASETO_SECRET_KEY must be a PASERK k4.local key (starts with 'k4.local.')"
    );
  }

  symmetricKey = envKey;
  return symmetricKey;
}

/**
 * Generate a new PASERK k4.local symmetric key for PASETO v4.local tokens.
 * Run once to set PASETO_SECRET_KEY env var.
 */
export function generateSymmetricKey(): string {
  return generateKeys("local") as string;
}

// ============================================================================
// Token Operations
// ============================================================================

/**
 * Issue an access + refresh token pair for a verified user.
 */
export function issueTokenPair(
  userId: string,
  walletAddress: string,
  isAdmin: boolean
): TokenPair {
  const key = getSymmetricKey();

  const basePayload = {
    sub: userId,
    wal: walletAddress,
    adm: isAdmin,
  };

  const now = Date.now();

  const accessToken = encrypt(key, {
    ...basePayload,
    typ: "access" as const,
    exp: new Date(now + AUTH_ACCESS_TOKEN_TTL * 1000).toISOString(),
  });

  const refreshToken = encrypt(key, {
    ...basePayload,
    typ: "refresh" as const,
    exp: new Date(now + AUTH_REFRESH_TOKEN_TTL * 1000).toISOString(),
  });

  return { accessToken, refreshToken };
}

/**
 * Verify and decode a PASETO v4.local token.
 * Throws on invalid/expired tokens.
 */
export function verifyToken<T extends TokenPayload>(token: string): T {
  const key = getSymmetricKey();
  const { payload } = decrypt<T>(key, token);
  return payload as T;
}

/**
 * Verify an access token specifically.
 * Ensures the token type is "access".
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = verifyToken<AccessTokenPayload>(token);

  if (payload.typ !== "access") {
    throw new Error(`Expected access token, received ${payload.typ}`);
  }

  return payload;
}

/**
 * Verify a refresh token specifically.
 * Ensures the token type is "refresh".
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = verifyToken<RefreshTokenPayload>(token);

  if (payload.typ !== "refresh") {
    throw new Error(`Expected refresh token, received ${payload.typ}`);
  }

  return payload;
}
