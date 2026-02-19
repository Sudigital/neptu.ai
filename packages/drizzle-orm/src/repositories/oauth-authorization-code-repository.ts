import { and, eq, isNull, lt } from "drizzle-orm";

import type { Database } from "../client";

import {
  oauthAuthorizationCodes,
  type NewOAuthAuthorizationCode,
  type OAuthAuthorizationCode,
} from "../schemas/oauth-authorization-codes";

export class OAuthAuthorizationCodeRepository {
  constructor(private db: Database) {}

  async create(
    data: NewOAuthAuthorizationCode
  ): Promise<OAuthAuthorizationCode> {
    await this.db.insert(oauthAuthorizationCodes).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create OAuth authorization code");
    }
    return result;
  }

  async findById(id: string): Promise<OAuthAuthorizationCode | null> {
    const result = await this.db
      .select()
      .from(oauthAuthorizationCodes)
      .where(eq(oauthAuthorizationCodes.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByCodeHash(
    codeHash: string
  ): Promise<OAuthAuthorizationCode | null> {
    const result = await this.db
      .select()
      .from(oauthAuthorizationCodes)
      .where(eq(oauthAuthorizationCodes.codeHash, codeHash))
      .limit(1);
    return result[0] ?? null;
  }

  async findValidByCodeHash(
    codeHash: string
  ): Promise<OAuthAuthorizationCode | null> {
    const now = new Date();
    const result = await this.db
      .select()
      .from(oauthAuthorizationCodes)
      .where(
        and(
          eq(oauthAuthorizationCodes.codeHash, codeHash),
          isNull(oauthAuthorizationCodes.usedAt)
        )
      )
      .limit(1);

    const code = result[0] ?? null;
    if (code && code.expiresAt < now) {
      return null;
    }
    return code;
  }

  async markUsed(id: string): Promise<void> {
    await this.db
      .update(oauthAuthorizationCodes)
      .set({ usedAt: new Date() })
      .where(eq(oauthAuthorizationCodes.id, id));
  }

  async deleteExpired(): Promise<void> {
    await this.db
      .delete(oauthAuthorizationCodes)
      .where(lt(oauthAuthorizationCodes.expiresAt, new Date()));
  }
}
