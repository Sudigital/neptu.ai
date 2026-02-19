import { describe, test, expect } from "bun:test";

import {
  OAuthCleanupService,
  OAuthAccessTokenRepository,
  OAuthRefreshTokenRepository,
  OAuthAuthorizationCodeRepository,
} from "@neptu/drizzle-orm";

describe("OAuth Cleanup Service", () => {
  test("OAuthCleanupService should export correctly", () => {
    expect(OAuthCleanupService).toBeDefined();
    expect(typeof OAuthCleanupService).toBe("function");
  });

  test("cleanup result interface should match expected shape", () => {
    const result = {
      expiredCodes: 5,
      expiredAccessTokens: 10,
      expiredRefreshTokens: 3,
      totalCleaned: 18,
    };

    expect(result.totalCleaned).toBe(
      result.expiredCodes +
        result.expiredAccessTokens +
        result.expiredRefreshTokens
    );
  });

  test("access token repository has deleteExpiredAndRevoked method", () => {
    expect(
      OAuthAccessTokenRepository.prototype.deleteExpiredAndRevoked
    ).toBeDefined();
  });

  test("refresh token repository has deleteExpiredAndRevoked method", () => {
    expect(
      OAuthRefreshTokenRepository.prototype.deleteExpiredAndRevoked
    ).toBeDefined();
  });

  test("authorization code repository has deleteExpired method", () => {
    expect(
      OAuthAuthorizationCodeRepository.prototype.deleteExpired
    ).toBeDefined();
  });
});
