import { createHmac } from "crypto";

import {
  OAUTH_MAX_WEBHOOKS_PER_CLIENT,
  OAUTH_WEBHOOK_EVENTS,
  OAUTH_WEBHOOK_MAX_RETRIES,
  OAUTH_WEBHOOK_SECRET_LENGTH,
  type OAuthWebhookEvent,
} from "@neptu/shared";

import type { Database } from "../client";
import type { OAuthWebhook } from "../schemas/oauth-webhooks";

import { OAuthWebhookDeliveryRepository } from "../repositories/oauth-webhook-delivery-repository";
import { OAuthWebhookRepository } from "../repositories/oauth-webhook-repository";

export interface WebhookDTO {
  id: string;
  clientId: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryDTO {
  id: string;
  event: string;
  status: string;
  httpStatus: number | null;
  attempts: number;
  deliveredAt: string | null;
  createdAt: string;
}

function toWebhookDTO(webhook: OAuthWebhook): WebhookDTO {
  return {
    id: webhook.id,
    clientId: webhook.clientId,
    url: webhook.url,
    events: (webhook.events ?? []) as string[],
    isActive: webhook.isActive,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
  };
}

export class OAuthWebhookService {
  private webhookRepo: OAuthWebhookRepository;
  private deliveryRepo: OAuthWebhookDeliveryRepository;

  constructor(db: Database) {
    this.webhookRepo = new OAuthWebhookRepository(db);
    this.deliveryRepo = new OAuthWebhookDeliveryRepository(db);
  }

  private generateSecret(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randomValues = new Uint8Array(OAUTH_WEBHOOK_SECRET_LENGTH);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < OAUTH_WEBHOOK_SECRET_LENGTH; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }

  private signPayload(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }

  async createWebhook(
    userId: string,
    clientId: string,
    input: { url: string; events: OAuthWebhookEvent[] }
  ): Promise<WebhookDTO & { secret: string }> {
    // Validate events
    const invalidEvents = input.events.filter(
      (e) => !OAUTH_WEBHOOK_EVENTS.includes(e)
    );
    if (invalidEvents.length > 0) {
      throw new Error(`Invalid webhook events: ${invalidEvents.join(", ")}`);
    }

    // Check limit
    const count = await this.webhookRepo.countByClientId(clientId);
    if (count >= OAUTH_MAX_WEBHOOKS_PER_CLIENT) {
      throw new Error(
        `Maximum of ${OAUTH_MAX_WEBHOOKS_PER_CLIENT} webhooks per client`
      );
    }

    // Validate URL
    try {
      const url = new URL(input.url);
      if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error("Webhook URL must use HTTPS or HTTP");
      }
    } catch {
      throw new Error("Invalid webhook URL");
    }

    const secret = this.generateSecret();
    const id = crypto.randomUUID();

    const webhook = await this.webhookRepo.create({
      id,
      userId,
      clientId,
      url: input.url,
      secret,
      events: input.events,
      isActive: true,
    });

    return {
      ...toWebhookDTO(webhook),
      secret,
    };
  }

  async getWebhooksByClientId(clientId: string): Promise<WebhookDTO[]> {
    const webhooks = await this.webhookRepo.findByClientId(clientId);
    return webhooks.map(toWebhookDTO);
  }

  async getWebhookById(
    id: string,
    clientId: string
  ): Promise<WebhookDTO | null> {
    const webhook = await this.webhookRepo.findById(id);
    if (!webhook || webhook.clientId !== clientId) return null;
    return toWebhookDTO(webhook);
  }

  async updateWebhook(
    id: string,
    clientId: string,
    input: {
      url?: string;
      events?: OAuthWebhookEvent[];
      isActive?: boolean;
    }
  ): Promise<WebhookDTO | null> {
    const existing = await this.webhookRepo.findById(id);
    if (!existing || existing.clientId !== clientId) return null;

    if (input.events) {
      const invalidEvents = input.events.filter(
        (e) => !OAUTH_WEBHOOK_EVENTS.includes(e)
      );
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid webhook events: ${invalidEvents.join(", ")}`);
      }
    }

    const updated = await this.webhookRepo.update(id, {
      ...(input.url !== undefined && { url: input.url }),
      ...(input.events !== undefined && { events: input.events }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    return updated ? toWebhookDTO(updated) : null;
  }

  async deleteWebhook(id: string, clientId: string): Promise<boolean> {
    const existing = await this.webhookRepo.findById(id);
    if (!existing || existing.clientId !== clientId) return false;
    return this.webhookRepo.delete(id);
  }

  async dispatchEvent(
    clientDbId: string,
    event: OAuthWebhookEvent,
    payload: Record<string, unknown>
  ): Promise<void> {
    const webhooks = await this.webhookRepo.findActiveByClientAndEvent(
      clientDbId,
      event
    );

    const deliveryPromises = webhooks.map((webhook) =>
      this.deliverWebhook(webhook, event, payload)
    );

    await Promise.allSettled(deliveryPromises);
  }

  private async deliverWebhook(
    webhook: OAuthWebhook,
    event: OAuthWebhookEvent,
    payload: Record<string, unknown>
  ): Promise<void> {
    const deliveryId = crypto.randomUUID();
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });
    const signature = this.signPayload(body, webhook.secret);

    await this.deliveryRepo.create({
      id: deliveryId,
      webhookId: webhook.id,
      event,
      payload,
      status: "pending",
      attempts: 0,
    });

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Neptu-Signature": `sha256=${signature}`,
          "X-Neptu-Event": event,
          "X-Neptu-Delivery": deliveryId,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      await this.deliveryRepo.updateStatus(deliveryId, {
        status: response.ok ? "delivered" : "failed",
        httpStatus: response.status,
        responseBody: await response.text().catch(() => ""),
        attempts: 1,
        deliveredAt: response.ok ? new Date() : null,
        nextRetryAt: response.ok ? null : new Date(Date.now() + 60000),
      });
    } catch (err) {
      await this.deliveryRepo.updateStatus(deliveryId, {
        status: "failed",
        httpStatus: undefined,
        responseBody: err instanceof Error ? err.message : "Unknown error",
        attempts: 1,
        nextRetryAt: new Date(Date.now() + 60000),
      });
    }
  }

  async retryFailedDeliveries(): Promise<number> {
    const pending = await this.deliveryRepo.findPendingRetries();
    let retried = 0;

    for (const delivery of pending) {
      if (delivery.attempts >= OAUTH_WEBHOOK_MAX_RETRIES) {
        await this.deliveryRepo.updateStatus(delivery.id, {
          status: "abandoned",
          attempts: delivery.attempts,
          nextRetryAt: null,
        });
        continue;
      }

      const webhook = await this.webhookRepo.findById(delivery.webhookId);
      if (!webhook || !webhook.isActive) {
        await this.deliveryRepo.updateStatus(delivery.id, {
          status: "abandoned",
          attempts: delivery.attempts,
          nextRetryAt: null,
        });
        continue;
      }

      const body = JSON.stringify({
        event: delivery.event,
        timestamp: delivery.createdAt.toISOString(),
        data: delivery.payload,
      });
      const signature = this.signPayload(body, webhook.secret);

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Neptu-Signature": `sha256=${signature}`,
            "X-Neptu-Event": delivery.event,
            "X-Neptu-Delivery": delivery.id,
          },
          body,
          signal: AbortSignal.timeout(10000),
        });

        const attempt = delivery.attempts + 1;
        await this.deliveryRepo.updateStatus(delivery.id, {
          status: response.ok ? "delivered" : "failed",
          httpStatus: response.status,
          responseBody: await response.text().catch(() => ""),
          attempts: attempt,
          deliveredAt: response.ok ? new Date() : null,
          nextRetryAt:
            response.ok || attempt >= OAUTH_WEBHOOK_MAX_RETRIES
              ? null
              : new Date(Date.now() + 60000 * Math.pow(2, attempt)),
        });
      } catch (err) {
        const attempt = delivery.attempts + 1;
        await this.deliveryRepo.updateStatus(delivery.id, {
          status: "failed",
          attempts: attempt,
          responseBody: err instanceof Error ? err.message : "Unknown error",
          nextRetryAt:
            attempt >= OAUTH_WEBHOOK_MAX_RETRIES
              ? null
              : new Date(Date.now() + 60000 * Math.pow(2, attempt)),
        });
      }
      retried++;
    }

    return retried;
  }

  async getDeliveries(webhookId: string): Promise<WebhookDeliveryDTO[]> {
    const deliveries = await this.deliveryRepo.findByWebhookId(webhookId);
    return deliveries.map((d) => ({
      id: d.id,
      event: d.event,
      status: d.status,
      httpStatus: d.httpStatus,
      attempts: d.attempts,
      deliveredAt: d.deliveredAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async cleanupOldDeliveries(retentionDays: number): Promise<number> {
    return this.deliveryRepo.deleteOlderThan(retentionDays);
  }
}
