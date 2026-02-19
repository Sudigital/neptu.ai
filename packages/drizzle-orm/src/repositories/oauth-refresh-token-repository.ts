import { and, eq, isNull, lt, or, isNotNull } from "drizzle-orm";

import type { Database } from "../client";

import {
  oauthRefreshTokens,
  type NewOAuthRefreshToken,
  type OAuthRefreshToken,
} from "../schemas/oauth-refresh-tokens";

export class OAuthRefreshTokenRepository {
  constructor(private db: Database) {}

  async create(data: NewOAuthRefreshToken): Promise<OAuthRefreshToken> {
    await this.db.insert(oauthRefreshTokens).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create OAuth refresh token");
    }
    return result;
  }

  async findById(id: string): Promise<OAuthRefreshToken | null> {
    const result = await this.db
      .select()
      .from(oauthRefreshTokens)
      .where(eq(oauthRefreshTokens.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByTokenHash(tokenHash: string): Promise<OAuthRefreshToken | null> {
    const result = await this.db
      .select()
      .from(oauthRefreshTokens)
      .where(eq(oauthRefreshTokens.tokenHash, tokenHash))
      .limit(1);
    return result[0] ?? null;
  }

  async findValidByTokenHash(
    tokenHash: string
  ): Promise<OAuthRefreshToken | null> {
    const now = new Date();
    const result = await this.db
      .select()
      .from(oauthRefreshTokens)
      .where(
        and(
          eq(oauthRefreshTokens.tokenHash, tokenHash),
          isNull(oauthRefreshTokens.revokedAt)
        )
      )
      .limit(1);

    const token = result[0] ?? null;
    if (token && token.expiresAt < now) {
      return null;
    }
    return token;
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(oauthRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(oauthRefreshTokens.id, id));
  }

  async revokeByAccessTokenId(accessTokenId: string): Promise<void> {
    await this.db
      .update(oauthRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(oauthRefreshTokens.accessTokenId, accessTokenId),
          isNull(oauthRefreshTokens.revokedAt)
        )
      );
  }

  async revokeByClientId(clientId: string): Promise<void> {
    await this.db
      .update(oauthRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(oauthRefreshTokens.clientId, clientId),
          isNull(oauthRefreshTokens.revokedAt)
        )
      );
  }

  async deleteExpiredAndRevoked(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(oauthRefreshTokens)
      .where(
        or(
          lt(oauthRefreshTokens.expiresAt, now),
          isNotNull(oauthRefreshTokens.revokedAt)
        )
      )
      .returning({ id: oauthRefreshTokens.id });
    return result.length;
  }
}
