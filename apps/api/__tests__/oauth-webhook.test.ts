import { describe, test, expect } from "bun:test";

import {
  OAuthWebhookService,
  OAuthWebhookRepository,
  OAuthWebhookDeliveryRepository,
} from "@neptu/drizzle-orm";
import {
  OAUTH_WEBHOOK_EVENTS,
  OAUTH_WEBHOOK_EVENT_DESCRIPTIONS,
  OAUTH_MAX_WEBHOOKS_PER_CLIENT,
  OAUTH_WEBHOOK_MAX_RETRIES,
  OAUTH_WEBHOOK_SECRET_LENGTH,
} from "@neptu/shared";

describe("OAuth Webhook Service", () => {
  test("OAuthWebhookService should export correctly", () => {
    expect(OAuthWebhookService).toBeDefined();
    expect(typeof OAuthWebhookService).toBe("function");
  });

  test("OAuthWebhookRepository should export correctly", () => {
    expect(OAuthWebhookRepository).toBeDefined();
    expect(typeof OAuthWebhookRepository).toBe("function");
  });

  test("OAuthWebhookDeliveryRepository should export correctly", () => {
    expect(OAuthWebhookDeliveryRepository).toBeDefined();
    expect(typeof OAuthWebhookDeliveryRepository).toBe("function");
  });

  test("webhook service has required methods", () => {
    const methods = [
      "createWebhook",
      "getWebhooksByClientId",
      "getWebhookById",
      "updateWebhook",
      "deleteWebhook",
      "dispatchEvent",
      "retryFailedDeliveries",
      "cleanupOldDeliveries",
      "getDeliveries",
    ];

    for (const method of methods) {
      expect(
        OAuthWebhookService.prototype[method as keyof OAuthWebhookService]
      ).toBeDefined();
    }
  });

  test("webhook repository has required methods", () => {
    const methods = [
      "create",
      "findById",
      "findByClientId",
      "findActiveByClientAndEvent",
      "update",
      "delete",
      "countByClientId",
    ];

    for (const method of methods) {
      expect(
        OAuthWebhookRepository.prototype[method as keyof OAuthWebhookRepository]
      ).toBeDefined();
    }
  });

  test("delivery repository has required methods", () => {
    const methods = [
      "create",
      "findByWebhookId",
      "findPendingRetries",
      "updateStatus",
      "deleteOlderThan",
    ];

    for (const method of methods) {
      expect(
        OAuthWebhookDeliveryRepository.prototype[
          method as keyof OAuthWebhookDeliveryRepository
        ]
      ).toBeDefined();
    }
  });
});

describe("OAuth Webhook Constants", () => {
  test("webhook events should be defined", () => {
    expect(OAUTH_WEBHOOK_EVENTS).toBeDefined();
    expect(Array.isArray(OAUTH_WEBHOOK_EVENTS)).toBe(true);
    expect(OAUTH_WEBHOOK_EVENTS.length).toBeGreaterThan(0);
  });

  test("webhook events should include required events", () => {
    const requiredEvents: (typeof OAUTH_WEBHOOK_EVENTS)[number][] = [
      "token.created",
      "token.revoked",
      "authorization.granted",
      "authorization.denied",
    ];

    for (const event of requiredEvents) {
      expect(OAUTH_WEBHOOK_EVENTS).toContain(event);
    }
  });

  test("all events should have descriptions", () => {
    for (const event of OAUTH_WEBHOOK_EVENTS) {
      expect(OAUTH_WEBHOOK_EVENT_DESCRIPTIONS[event]).toBeDefined();
      expect(typeof OAUTH_WEBHOOK_EVENT_DESCRIPTIONS[event]).toBe("string");
    }
  });

  test("webhook limits should be properly defined", () => {
    expect(OAUTH_MAX_WEBHOOKS_PER_CLIENT).toBe(5);
    expect(OAUTH_WEBHOOK_MAX_RETRIES).toBe(3);
    expect(OAUTH_WEBHOOK_SECRET_LENGTH).toBe(32);
  });
});

describe("OAuth Webhook Validators", () => {
  test("createWebhookSchema should validate correctly", async () => {
    const { createWebhookSchema } = await import("@neptu/drizzle-orm");

    const validInput = {
      url: "https://example.com/webhook",
      events: ["token.created", "token.revoked"],
    };

    const result = createWebhookSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test("createWebhookSchema should reject invalid URL", async () => {
    const { createWebhookSchema } = await import("@neptu/drizzle-orm");

    const invalidInput = {
      url: "not-a-url",
      events: ["token.created"],
    };

    const result = createWebhookSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  test("createWebhookSchema should reject empty events", async () => {
    const { createWebhookSchema } = await import("@neptu/drizzle-orm");

    const invalidInput = {
      url: "https://example.com/webhook",
      events: [],
    };

    const result = createWebhookSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  test("updateWebhookSchema should allow partial updates", async () => {
    const { updateWebhookSchema } = await import("@neptu/drizzle-orm");

    const partialUpdate = {
      isActive: false,
    };

    const result = updateWebhookSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });
});
