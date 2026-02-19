import {
  ApiUsageService,
  ApiKeyService,
  type Database,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";

import { type AuthEnv } from "../../middleware/paseto-auth";

type Env = AuthEnv & {
  Variables: AuthEnv["Variables"] & {
    db: Database;
  };
};

export const apiUsageRoutes = new Hono<Env>();

apiUsageRoutes.get("/keys/:keyId/usage", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const keyId = c.req.param("keyId");
  const limit = Number(c.req.query("limit")) || 100;

  const apiKeyService = new ApiKeyService(db);
  const key = await apiKeyService.getKeyById(keyId);

  if (!key || key.userId !== userId) {
    return c.json({ success: false, error: "API key not found" }, 404);
  }

  const apiUsageService = new ApiUsageService(db);
  const usage = await apiUsageService.getUsageByApiKeyId(keyId, limit);

  return c.json({ success: true, usage });
});

apiUsageRoutes.get("/keys/:keyId/summary", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const keyId = c.req.param("keyId");

  const apiKeyService = new ApiKeyService(db);
  const key = await apiKeyService.getKeyById(keyId);

  if (!key || key.userId !== userId) {
    return c.json({ success: false, error: "API key not found" }, 404);
  }

  const apiUsageService = new ApiUsageService(db);
  const summary = await apiUsageService.getCurrentMonthSummary(keyId);

  return c.json({ success: true, summary });
});

apiUsageRoutes.get("/keys/:keyId/usage/range", async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const keyId = c.req.param("keyId");
  const startDate = c.req.query("start");
  const endDate = c.req.query("end");

  if (!startDate || !endDate) {
    return c.json(
      { success: false, error: "Start and end dates required" },
      400
    );
  }

  const apiKeyService = new ApiKeyService(db);
  const key = await apiKeyService.getKeyById(keyId);

  if (!key || key.userId !== userId) {
    return c.json({ success: false, error: "API key not found" }, 404);
  }

  const apiUsageService = new ApiUsageService(db);
  const summary = await apiUsageService.getUsageSummary(
    keyId,
    new Date(startDate),
    new Date(endDate)
  );

  return c.json({ success: true, summary });
});
