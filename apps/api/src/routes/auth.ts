import { zValidator } from "@hono/zod-validator";
import { UserService, type Database } from "@neptu/drizzle-orm";
import { AUTH_NONCE_TTL, AUTH_NONCE_MESSAGE } from "@neptu/shared";
import { getAddressEncoder, getBase58Decoder, address } from "@solana/kit";
import { Hono } from "hono";
import { z } from "zod";

import { issueTokenPair, verifyRefreshToken } from "../lib/paseto";

// ============================================================================
// Types
// ============================================================================

type Env = {
  Variables: { db: Database };
};

// ============================================================================
// In-memory nonce store (TTL-based cleanup)
// ============================================================================

interface NonceEntry {
  nonce: string;
  createdAt: number;
}

const nonceStore = new Map<string, NonceEntry>();

function cleanExpiredNonces(): void {
  const now = Date.now();
  for (const [key, entry] of nonceStore) {
    if (now - entry.createdAt > AUTH_NONCE_TTL * 1000) {
      nonceStore.delete(key);
    }
  }
}

// Periodic cleanup every 60 seconds
setInterval(cleanExpiredNonces, 60_000);

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================================
// Validation Schemas
// ============================================================================

const nonceSchema = z.object({
  walletAddress: z.string().min(32).max(64),
});

const verifySchema = z.object({
  walletAddress: z.string().min(32).max(64),
  signature: z.string().min(64),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ============================================================================
// Routes
// ============================================================================

export const authRoutes = new Hono<Env>();

/**
 * POST /api/auth/nonce
 * Request a nonce for wallet signature authentication.
 */
authRoutes.post("/nonce", zValidator("json", nonceSchema), async (c) => {
  const { walletAddress } = c.req.valid("json");

  // Validate Solana address format (32 bytes when decoded)
  try {
    address(walletAddress);
  } catch {
    return c.json(
      { success: false, error: "Invalid Solana wallet address" },
      400
    );
  }

  const nonce = generateNonce();
  const message = AUTH_NONCE_MESSAGE.replace("{nonce}", nonce);

  nonceStore.set(walletAddress, {
    nonce,
    createdAt: Date.now(),
  });

  return c.json({ success: true, nonce, message });
});

/**
 * POST /api/auth/verify
 * Verify a signed nonce and issue PASETO token pair.
 */
authRoutes.post("/verify", zValidator("json", verifySchema), async (c) => {
  const { walletAddress, signature } = c.req.valid("json");

  // Check active nonce
  const entry = nonceStore.get(walletAddress);
  if (!entry) {
    return c.json(
      { success: false, error: "No pending nonce. Request /nonce first." },
      400
    );
  }

  // Check nonce expiry
  const elapsed = Date.now() - entry.createdAt;
  if (elapsed > AUTH_NONCE_TTL * 1000) {
    nonceStore.delete(walletAddress);
    return c.json(
      { success: false, error: "Nonce expired. Request a new one." },
      400
    );
  }

  // Reconstruct the signed message
  const message = AUTH_NONCE_MESSAGE.replace("{nonce}", entry.nonce);
  const messageBytes = new TextEncoder().encode(message);

  // Decode wallet address (base58 → 32 bytes) → import as Ed25519 public key
  const addressEncoder = getAddressEncoder();
  const publicKeyBytes = addressEncoder.encode(address(walletAddress));

  // Decode signature (supports both hex and base58 encoding)
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = decodeSignature(signature);
  } catch {
    return c.json({ success: false, error: "Invalid signature format" }, 400);
  }

  // Verify Ed25519 signature using Web Crypto API
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      "Ed25519",
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "Ed25519",
      cryptoKey,
      signatureBytes,
      messageBytes
    );

    if (!valid) {
      return c.json(
        { success: false, error: "Signature verification failed" },
        401
      );
    }
  } catch {
    return c.json(
      { success: false, error: "Signature verification failed" },
      401
    );
  }

  // Consume nonce (one-time use)
  nonceStore.delete(walletAddress);

  // Get or create user
  const db = c.get("db");
  const userService = new UserService(db);
  let user = await userService.getUserByWallet(walletAddress);

  if (!user) {
    user = await userService.createUser({ walletAddress });
  }

  // Issue PASETO token pair
  const tokens = issueTokenPair(user.id, walletAddress, user.isAdmin ?? false);

  return c.json({
    success: true,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      onboarded: user.onboarded,
      isAdmin: user.isAdmin,
    },
    ...tokens,
  });
});

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new token pair.
 */
authRoutes.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  try {
    const payload = verifyRefreshToken(refreshToken);

    // Look up current user state (admin status may have changed)
    const db = c.get("db");
    const userService = new UserService(db);
    const user = await userService.getUserByWallet(payload.wal);

    if (!user) {
      return c.json({ success: false, error: "User no longer exists" }, 401);
    }

    // Issue fresh token pair
    const tokens = issueTokenPair(
      user.id,
      user.walletAddress,
      user.isAdmin ?? false
    );

    return c.json({
      success: true,
      ...tokens,
    });
  } catch {
    return c.json(
      { success: false, error: "Invalid or expired refresh token" },
      401
    );
  }
});

// ============================================================================
// Helpers
// ============================================================================

const HEX_PATTERN = /^(0x)?[0-9a-fA-F]+$/;
const ED25519_SIGNATURE_LENGTH = 64;

function isHex(value: string): boolean {
  return HEX_PATTERN.test(value);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function decodeSignature(signature: string): Uint8Array {
  // Try hex first (128 hex chars = 64 bytes Ed25519 signature)
  if (isHex(signature)) {
    return hexToBytes(signature);
  }

  // Otherwise treat as base58 (Solana wallet adapters encode signatures as base58)
  const decoder = getBase58Decoder();
  const bytes = decoder.decode(signature);

  if (bytes.length !== ED25519_SIGNATURE_LENGTH) {
    throw new Error(
      `Expected ${ED25519_SIGNATURE_LENGTH}-byte signature, got ${bytes.length}`
    );
  }

  return bytes;
}
