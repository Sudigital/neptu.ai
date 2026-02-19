import { zValidator } from "@hono/zod-validator";
import {
  OAuthClientService,
  type Database,
  createOAuthClientSchema,
  updateOAuthClientSchema,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";

import { pasetoAuth, type AuthEnv } from "../../middleware/paseto-auth";

type Env = AuthEnv & {
  Variables: AuthEnv["Variables"] & {
    db: Database;
  };
};

export const developerOAuthRoutes = new Hono<Env>();

developerOAuthRoutes.use("/*", pasetoAuth);

// List developer's OAuth clients
developerOAuthRoutes.get("/clients", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;

  const service = new OAuthClientService(db);
  const clients = await service.getClientsByUserId(userId);

  return c.json({ success: true, clients });
});

// Create OAuth client
developerOAuthRoutes.post(
  "/clients",
  zValidator("json", createOAuthClientSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const input = c.req.valid("json");

    const service = new OAuthClientService(db);

    try {
      const client = await service.createClient(userId, input);

      return c.json({
        success: true,
        client,
        warning: "Store the clientSecret securely. It will not be shown again.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create OAuth client";
      return c.json({ success: false, error: message }, 400);
    }
  }
);

// Get OAuth client details
developerOAuthRoutes.get("/clients/:id", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const id = c.req.param("id");

  const service = new OAuthClientService(db);
  const client = await service.getClientById(id);

  if (!client || client.userId !== userId) {
    return c.json({ success: false, error: "OAuth client not found" }, 404);
  }

  return c.json({ success: true, client });
});

// Update OAuth client
developerOAuthRoutes.patch(
  "/clients/:id",
  zValidator("json", updateOAuthClientSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const id = c.req.param("id");
    const input = c.req.valid("json");

    const service = new OAuthClientService(db);
    const client = await service.updateClient(id, userId, input);

    if (!client) {
      return c.json({ success: false, error: "OAuth client not found" }, 404);
    }

    return c.json({ success: true, client });
  }
);

// Rotate client secret
developerOAuthRoutes.post("/clients/:id/rotate-secret", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const id = c.req.param("id");

  const service = new OAuthClientService(db);
  const result = await service.rotateSecret(id, userId);

  if (!result) {
    return c.json({ success: false, error: "OAuth client not found" }, 404);
  }

  return c.json({
    success: true,
    client: result,
    warning: "Store the new clientSecret securely. It will not be shown again.",
  });
});

// Delete OAuth client
developerOAuthRoutes.delete("/clients/:id", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const id = c.req.param("id");

  const service = new OAuthClientService(db);
  const deleted = await service.deleteClient(id, userId);

  if (!deleted) {
    return c.json({ success: false, error: "OAuth client not found" }, 404);
  }

  return c.json({ success: true, message: "OAuth client deleted" });
});
