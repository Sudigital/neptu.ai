import { and, count, desc, eq } from "drizzle-orm";

import type { Database } from "../client";

import {
  oauthClients,
  type NewOAuthClient,
  type OAuthClient,
} from "../schemas/oauth-clients";

export class OAuthClientRepository {
  constructor(private db: Database) {}

  async create(data: NewOAuthClient): Promise<OAuthClient> {
    const now = new Date();
    await this.db.insert(oauthClients).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create OAuth client");
    }
    return result;
  }

  async findById(id: string): Promise<OAuthClient | null> {
    const result = await this.db
      .select()
      .from(oauthClients)
      .where(eq(oauthClients.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByClientId(clientId: string): Promise<OAuthClient | null> {
    const result = await this.db
      .select()
      .from(oauthClients)
      .where(eq(oauthClients.clientId, clientId))
      .limit(1);
    return result[0] ?? null;
  }

  async findActiveByClientId(clientId: string): Promise<OAuthClient | null> {
    const result = await this.db
      .select()
      .from(oauthClients)
      .where(
        and(
          eq(oauthClients.clientId, clientId),
          eq(oauthClients.isActive, true)
        )
      )
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserId(userId: string): Promise<OAuthClient[]> {
    return this.db
      .select()
      .from(oauthClients)
      .where(eq(oauthClients.userId, userId))
      .orderBy(desc(oauthClients.createdAt));
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select({ total: count() })
      .from(oauthClients)
      .where(eq(oauthClients.userId, userId));
    return result[0]?.total ?? 0;
  }

  async update(
    id: string,
    data: Partial<Omit<NewOAuthClient, "id">>
  ): Promise<OAuthClient | null> {
    await this.db
      .update(oauthClients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(oauthClients.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(oauthClients).where(eq(oauthClients.id, id));
    return true;
  }
}
