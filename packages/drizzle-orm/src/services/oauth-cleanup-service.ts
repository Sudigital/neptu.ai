import type { Database } from "../client";

import { OAuthAccessTokenRepository } from "../repositories/oauth-access-token-repository";
import { OAuthAuthorizationCodeRepository } from "../repositories/oauth-authorization-code-repository";
import { OAuthRefreshTokenRepository } from "../repositories/oauth-refresh-token-repository";

export interface OAuthCleanupResult {
  expiredCodes: number;
  expiredAccessTokens: number;
  expiredRefreshTokens: number;
  totalCleaned: number;
}

export class OAuthCleanupService {
  private codeRepo: OAuthAuthorizationCodeRepository;
  private accessTokenRepo: OAuthAccessTokenRepository;
  private refreshTokenRepo: OAuthRefreshTokenRepository;

  constructor(db: Database) {
    this.codeRepo = new OAuthAuthorizationCodeRepository(db);
    this.accessTokenRepo = new OAuthAccessTokenRepository(db);
    this.refreshTokenRepo = new OAuthRefreshTokenRepository(db);
  }

  async cleanupExpiredTokens(): Promise<OAuthCleanupResult> {
    // Delete expired/used authorization codes
    await this.codeRepo.deleteExpired();

    // Delete expired + revoked access tokens
    const expiredAccessTokens =
      await this.accessTokenRepo.deleteExpiredAndRevoked();

    // Delete expired + revoked refresh tokens
    const expiredRefreshTokens =
      await this.refreshTokenRepo.deleteExpiredAndRevoked();

    // Authorization codes don't return count, but that's fine
    return {
      expiredCodes: 0,
      expiredAccessTokens,
      expiredRefreshTokens,
      totalCleaned: expiredAccessTokens + expiredRefreshTokens,
    };
  }
}
