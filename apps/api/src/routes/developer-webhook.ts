import { zValidator } from "@hono/zod-validator";
import {
  OAuthClientService,
  OAuthWebhookService,
  type Database,
  createWebhookSchema,
  updateWebhookSchema,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";

import { pasetoAuth, type AuthEnv } from "../middleware/paseto-auth";

type Env = AuthEnv & {
  Variables: AuthEnv["Variables"] & {
    db: Database;
  };
};

export const developerWebhookRoutes = new Hono<Env>();

developerWebhookRoutes.use("/*", pasetoAuth);

// List webhooks for a client
developerWebhookRoutes.get("/clients/:clientId/webhooks", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const clientId = c.req.param("clientId");

  const clientService = new OAuthClientService(db);
  const client = await clientService.getClientById(clientId);
  if (!client || client.userId !== userId) {
    return c.json({ success: false, error: "Client not found" }, 404);
  }

  const webhookService = new OAuthWebhookService(db);
  const webhooks = await webhookService.getWebhooksByClientId(clientId);

  return c.json({ success: true, webhooks });
});

// Create webhook
developerWebhookRoutes.post(
  "/clients/:clientId/webhooks",
  zValidator("json", createWebhookSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const clientId = c.req.param("clientId");
    const input = c.req.valid("json");

    const clientService = new OAuthClientService(db);
    const client = await clientService.getClientById(clientId);
    if (!client || client.userId !== userId) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    const webhookService = new OAuthWebhookService(db);

    try {
      const webhook = await webhookService.createWebhook(
        userId,
        clientId,
        input
      );

      return c.json({
        success: true,
        webhook,
        warning:
          "Store the webhook secret securely. It will not be shown again.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create webhook";
      return c.json({ success: false, error: message }, 400);
    }
  }
);

// Update webhook
developerWebhookRoutes.patch(
  "/clients/:clientId/webhooks/:webhookId",
  zValidator("json", updateWebhookSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const clientId = c.req.param("clientId");
    const webhookId = c.req.param("webhookId");
    const input = c.req.valid("json");

    const clientService = new OAuthClientService(db);
    const client = await clientService.getClientById(clientId);
    if (!client || client.userId !== userId) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    const webhookService = new OAuthWebhookService(db);
    const webhook = await webhookService.updateWebhook(
      webhookId,
      clientId,
      input
    );

    if (!webhook) {
      return c.json({ success: false, error: "Webhook not found" }, 404);
    }

    return c.json({ success: true, webhook });
  }
);

// Delete webhook
developerWebhookRoutes.delete(
  "/clients/:clientId/webhooks/:webhookId",
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const clientId = c.req.param("clientId");
    const webhookId = c.req.param("webhookId");

    const clientService = new OAuthClientService(db);
    const client = await clientService.getClientById(clientId);
    if (!client || client.userId !== userId) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    const webhookService = new OAuthWebhookService(db);
    const deleted = await webhookService.deleteWebhook(webhookId, clientId);

    if (!deleted) {
      return c.json({ success: false, error: "Webhook not found" }, 404);
    }

    return c.json({ success: true, message: "Webhook deleted" });
  }
);

// Get webhook deliveries
developerWebhookRoutes.get(
  "/clients/:clientId/webhooks/:webhookId/deliveries",
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const clientId = c.req.param("clientId");
    const webhookId = c.req.param("webhookId");

    const clientService = new OAuthClientService(db);
    const client = await clientService.getClientById(clientId);
    if (!client || client.userId !== userId) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    const webhookService = new OAuthWebhookService(db);
    const webhook = await webhookService.getWebhookById(webhookId, clientId);
    if (!webhook) {
      return c.json({ success: false, error: "Webhook not found" }, 404);
    }

    const deliveries = await webhookService.getDeliveries(webhookId);

    return c.json({ success: true, deliveries });
  }
);
