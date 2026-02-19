import { and, eq } from "drizzle-orm";

import type { Database } from "../client";

import {
  oauthWebhooks,
  type NewOAuthWebhook,
  type OAuthWebhook,
} from "../schemas/oauth-webhooks";

export class OAuthWebhookRepository {
  constructor(private db: Database) {}

  async create(data: NewOAuthWebhook): Promise<OAuthWebhook> {
    await this.db.insert(oauthWebhooks).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create OAuth webhook");
    }
    return result;
  }

  async findById(id: string): Promise<OAuthWebhook | null> {
    const result = await this.db
      .select()
      .from(oauthWebhooks)
      .where(eq(oauthWebhooks.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByClientId(clientId: string): Promise<OAuthWebhook[]> {
    return this.db
      .select()
      .from(oauthWebhooks)
      .where(eq(oauthWebhooks.clientId, clientId));
  }

  async findActiveByClientAndEvent(
    clientId: string,
    event: string
  ): Promise<OAuthWebhook[]> {
    const all = await this.db
      .select()
      .from(oauthWebhooks)
      .where(
        and(
          eq(oauthWebhooks.clientId, clientId),
          eq(oauthWebhooks.isActive, true)
        )
      );

    return all.filter((w) => {
      const events = w.events as string[];
      return events.includes(event);
    });
  }

  async findByUserId(userId: string): Promise<OAuthWebhook[]> {
    return this.db
      .select()
      .from(oauthWebhooks)
      .where(eq(oauthWebhooks.userId, userId));
  }

  async update(
    id: string,
    data: Partial<Pick<OAuthWebhook, "url" | "events" | "isActive">>
  ): Promise<OAuthWebhook | null> {
    await this.db
      .update(oauthWebhooks)
      .set(data)
      .where(eq(oauthWebhooks.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(oauthWebhooks)
      .where(eq(oauthWebhooks.id, id))
      .returning({ id: oauthWebhooks.id });
    return result.length > 0;
  }

  async countByClientId(clientId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(oauthWebhooks)
      .where(eq(oauthWebhooks.clientId, clientId));
    return result.length;
  }
}
