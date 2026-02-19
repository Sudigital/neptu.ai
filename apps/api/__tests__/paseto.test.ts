import { describe, test, expect, beforeAll } from "bun:test";
import crypto from "crypto";

import {
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
} from "../src/lib/paseto";

// Set up a test JWT secret before running tests
beforeAll(() => {
  process.env.JWT_SECRET = crypto.randomBytes(64).toString("hex");
});

const TEST_USER_ID = "test-user-id-123";
const TEST_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const TEST_ROLE = "user" as const;

describe("JWT Token Service", () => {
  describe("issueTokenPair", () => {
    test("should issue access and refresh tokens", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
      // JWT format: header.payload.signature
      expect(tokens.accessToken.split(".").length).toBe(3);
      expect(tokens.refreshToken.split(".").length).toBe(3);
    });

    test("should encode admin role correctly", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, "admin");
      const payload = verifyAccessToken(tokens.accessToken);

      expect(payload.role).toBe("admin");
    });
  });

  describe("verifyAccessToken", () => {
    test("should verify a valid access token", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);
      const payload = verifyAccessToken(tokens.accessToken);

      expect(payload.sub).toBe(TEST_USER_ID);
      expect(payload.wal).toBe(TEST_WALLET);
      expect(payload.role).toBe(TEST_ROLE);
      expect(payload.typ).toBe("access");
    });

    test("should reject a refresh token used as access", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);

      expect(() => verifyAccessToken(tokens.refreshToken)).toThrow(
        "Expected access token, received refresh"
      );
    });

    test("should reject a tampered token", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);

      const tampered = tokens.accessToken.slice(0, -5) + "AAAAA";

      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    test("should verify a valid refresh token", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);
      const payload = verifyRefreshToken(tokens.refreshToken);

      expect(payload.sub).toBe(TEST_USER_ID);
      expect(payload.wal).toBe(TEST_WALLET);
      expect(payload.role).toBe(TEST_ROLE);
      expect(payload.typ).toBe("refresh");
    });

    test("should reject an access token used as refresh", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);

      expect(() => verifyRefreshToken(tokens.accessToken)).toThrow(
        "Expected refresh token, received access"
      );
    });
  });

  describe("verifyToken (generic)", () => {
    test("should decode both token types", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);

      const access = verifyToken(tokens.accessToken);
      expect(access.typ).toBe("access");

      const refresh = verifyToken(tokens.refreshToken);
      expect(refresh.typ).toBe("refresh");
    });

    test("should reject garbage input", () => {
      expect(() => verifyToken("not-a-valid-token")).toThrow();
    });
  });
});
