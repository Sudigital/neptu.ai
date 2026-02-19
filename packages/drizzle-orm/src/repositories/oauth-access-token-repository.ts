import { and, eq, isNull, lt, or, isNotNull } from "drizzle-orm";

import type { Database } from "../client";

import {
  oauthAccessTokens,
  type NewOAuthAccessToken,
  type OAuthAccessToken,
} from "../schemas/oauth-access-tokens";

export class OAuthAccessTokenRepository {
  constructor(private db: Database) {}

  async create(data: NewOAuthAccessToken): Promise<OAuthAccessToken> {
    await this.db.insert(oauthAccessTokens).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create OAuth access token");
    }
    return result;
  }

  async findById(id: string): Promise<OAuthAccessToken | null> {
    const result = await this.db
      .select()
      .from(oauthAccessTokens)
      .where(eq(oauthAccessTokens.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByTokenHash(tokenHash: string): Promise<OAuthAccessToken | null> {
    const result = await this.db
      .select()
      .from(oauthAccessTokens)
      .where(eq(oauthAccessTokens.tokenHash, tokenHash))
      .limit(1);
    return result[0] ?? null;
  }

  async findValidByTokenHash(
    tokenHash: string
  ): Promise<OAuthAccessToken | null> {
    const now = new Date();
    const result = await this.db
      .select()
      .from(oauthAccessTokens)
      .where(
        and(
          eq(oauthAccessTokens.tokenHash, tokenHash),
          isNull(oauthAccessTokens.revokedAt)
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
      .update(oauthAccessTokens)
      .set({ revokedAt: new Date() })
      .where(eq(oauthAccessTokens.id, id));
  }

  async revokeByClientId(clientId: string): Promise<void> {
    await this.db
      .update(oauthAccessTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(oauthAccessTokens.clientId, clientId),
          isNull(oauthAccessTokens.revokedAt)
        )
      );
  }

  async revokeByUserAndClient(userId: string, clientId: string): Promise<void> {
    await this.db
      .update(oauthAccessTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(oauthAccessTokens.userId, userId),
          eq(oauthAccessTokens.clientId, clientId),
          isNull(oauthAccessTokens.revokedAt)
        )
      );
  }

  async deleteExpiredAndRevoked(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(oauthAccessTokens)
      .where(
        or(
          lt(oauthAccessTokens.expiresAt, now),
          isNotNull(oauthAccessTokens.revokedAt)
        )
      )
      .returning({ id: oauthAccessTokens.id });
    return result.length;
  }
}
