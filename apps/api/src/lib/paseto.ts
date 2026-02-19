import {
  AUTH_ACCESS_TOKEN_TTL,
  AUTH_REFRESH_TOKEN_TTL,
  type UserRole,
} from "@neptu/shared";
import jwt from "jsonwebtoken";

// ============================================================================
// Types
// ============================================================================

export interface TokenPayload {
  /** User ID (database primary key) */
  sub: string;
  /** Wallet address */
  wal: string;
  /** User role */
  role: UserRole;
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

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET env var is required. " +
        "Generate one with: bun -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }
  return secret;
}

// ============================================================================
// Token Operations
// ============================================================================

/**
 * Issue an access + refresh JWT pair for a verified user.
 * Access token: 30-day expiry. Refresh token: 30-day expiry.
 */
export function issueTokenPair(
  userId: string,
  walletAddress: string,
  role: UserRole
): TokenPair {
  const secret = getSecret();

  const basePayload = {
    sub: userId,
    wal: walletAddress,
    role,
  };

  const accessToken = jwt.sign(
    { ...basePayload, typ: "access" as const },
    secret,
    { expiresIn: AUTH_ACCESS_TOKEN_TTL }
  );

  const refreshToken = jwt.sign(
    { ...basePayload, typ: "refresh" as const },
    secret,
    { expiresIn: AUTH_REFRESH_TOKEN_TTL }
  );

  return { accessToken, refreshToken };
}

/**
 * Verify and decode a JWT token.
 * Throws on invalid/expired tokens.
 */
export function verifyToken<T extends TokenPayload>(token: string): T {
  const secret = getSecret();
  const payload = jwt.verify(token, secret) as T;
  if (!payload.sub || !payload.wal) {
    throw new Error("Invalid JWT payload");
  }
  return payload;
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
