import { describe, test, expect, beforeAll } from "bun:test";

import { generateKeys } from "paseto-ts/v4";

import {
  generateSymmetricKey,
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
} from "../src/lib/paseto";

// Set up a test PASETO key before running tests
beforeAll(() => {
  const key = generateKeys("local") as string;
  process.env.PASETO_SECRET_KEY = key;
});

const TEST_USER_ID = "test-user-id-123";
const TEST_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const TEST_ROLE = "user" as const;

describe("PASETO Token Service", () => {
  describe("generateSymmetricKey", () => {
    test("should generate a valid k4.local key", () => {
      const key = generateSymmetricKey();
      expect(key).toStartWith("k4.local.");
      expect(key.length).toBeGreaterThan(10);
    });
  });

  describe("issueTokenPair", () => {
    test("should issue access and refresh tokens", () => {
      const tokens = issueTokenPair(TEST_USER_ID, TEST_WALLET, TEST_ROLE);

      expect(tokens.accessToken).toStartWith("v4.local.");
      expect(tokens.refreshToken).toStartWith("v4.local.");
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    test("should encode admin flag correctly", () => {
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
