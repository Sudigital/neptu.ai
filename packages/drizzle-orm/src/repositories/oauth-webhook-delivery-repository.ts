import { and, eq, lt } from "drizzle-orm";

import type { Database } from "../client";

import {
  oauthWebhookDeliveries,
  type NewOAuthWebhookDelivery,
  type OAuthWebhookDelivery,
} from "../schemas/oauth-webhook-deliveries";

export class OAuthWebhookDeliveryRepository {
  constructor(private db: Database) {}

  async create(data: NewOAuthWebhookDelivery): Promise<OAuthWebhookDelivery> {
    await this.db.insert(oauthWebhookDeliveries).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create webhook delivery");
    }
    return result;
  }

  async findById(id: string): Promise<OAuthWebhookDelivery | null> {
    const result = await this.db
      .select()
      .from(oauthWebhookDeliveries)
      .where(eq(oauthWebhookDeliveries.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByWebhookId(webhookId: string): Promise<OAuthWebhookDelivery[]> {
    return this.db
      .select()
      .from(oauthWebhookDeliveries)
      .where(eq(oauthWebhookDeliveries.webhookId, webhookId))
      .orderBy(oauthWebhookDeliveries.createdAt);
  }

  async findPendingRetries(): Promise<OAuthWebhookDelivery[]> {
    const now = new Date();
    return this.db
      .select()
      .from(oauthWebhookDeliveries)
      .where(
        and(
          eq(oauthWebhookDeliveries.status, "pending"),
          lt(oauthWebhookDeliveries.nextRetryAt, now)
        )
      );
  }

  async updateStatus(
    id: string,
    data: {
      status: string;
      httpStatus?: number;
      responseBody?: string;
      attempts: number;
      nextRetryAt?: Date | null;
      deliveredAt?: Date | null;
    }
  ): Promise<void> {
    await this.db
      .update(oauthWebhookDeliveries)
      .set(data)
      .where(eq(oauthWebhookDeliveries.id, id));
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 86400000);
    const result = await this.db
      .delete(oauthWebhookDeliveries)
      .where(lt(oauthWebhookDeliveries.createdAt, cutoff))
      .returning({ id: oauthWebhookDeliveries.id });
    return result.length;
  }
}
