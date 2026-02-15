import {
  ApiUsageService,
  ApiKeyService,
  UserService,
  type Database,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";

type Env = {
  Variables: {
    db: Database;
    adminWalletAddress: string | undefined;
    userId: string;
  };
};

export const apiUsageRoutes = new Hono<Env>();

const requireAuth = async (
  c: {
    get: (key: string) => Database | string | undefined;
    req: { header: (name: string) => string | undefined };
    json: (data: unknown, status?: number) => Response;
    set: (key: string, value: unknown) => void;
  },
  next: () => Promise<void>
) => {
  const db = c.get("db") as Database;
  const walletAddress = c.req.header("X-Wallet-Address");

  if (!walletAddress) {
    return c.json({ success: false, error: "Wallet address required" }, 401);
  }

  const userService = new UserService(db);
  const user = await userService.getUserByWallet(walletAddress);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  c.set("userId", user.id);
  await next();
};

apiUsageRoutes.get("/keys/:keyId/usage", requireAuth, async (c) => {
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

apiUsageRoutes.get("/keys/:keyId/summary", requireAuth, async (c) => {
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

apiUsageRoutes.get("/keys/:keyId/usage/range", requireAuth, async (c) => {
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
