import { zValidator } from "@hono/zod-validator";
import {
  ApiKeyService,
  ApiSubscriptionService,
  UserService,
  type Database,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

type Env = {
  Variables: {
    db: Database;
    adminWalletAddress: string | undefined;
    userId: string;
    walletAddress: string;
  };
};

export const developerRoutes = new Hono<Env>();

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
  c.set("walletAddress", walletAddress);
  await next();
};

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(
    z.enum(["neptu:read", "neptu:write", "neptu:ai", "neptu:admin"])
  ),
  allowedOrigins: z.array(z.string().url()).optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

developerRoutes.get("/keys", requireAuth, async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const apiKeyService = new ApiKeyService(db);

  const keys = await apiKeyService.getKeysByUserId(userId);
  return c.json({ success: true, keys });
});

developerRoutes.post(
  "/keys",
  requireAuth,
  zValidator("json", createApiKeySchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const input = c.req.valid("json");

    const apiKeyService = new ApiKeyService(db);
    const apiSubscriptionService = new ApiSubscriptionService(db);

    const subscription =
      await apiSubscriptionService.getActiveSubscription(userId);
    if (!subscription) {
      return c.json(
        { success: false, error: "Active API subscription required" },
        403
      );
    }

    const key = await apiKeyService.createKey(
      userId,
      input,
      subscription.planId
    );

    return c.json({
      success: true,
      key,
      warning: "Store the secret securely. It will not be shown again.",
    });
  }
);

developerRoutes.put(
  "/keys/:keyId",
  requireAuth,
  zValidator("json", updateApiKeySchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const keyId = c.req.param("keyId");
    const input = c.req.valid("json");

    const apiKeyService = new ApiKeyService(db);
    const key = await apiKeyService.updateKey(keyId, userId, input);

    if (!key) {
      return c.json({ success: false, error: "API key not found" }, 404);
    }

    return c.json({ success: true, key });
  }
);

developerRoutes.delete("/keys/:keyId", requireAuth, async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;
  const keyId = c.req.param("keyId");

  const apiKeyService = new ApiKeyService(db);
  const deleted = await apiKeyService.revokeKey(keyId, userId);

  if (!deleted) {
    return c.json({ success: false, error: "API key not found" }, 404);
  }

  return c.json({ success: true, message: "API key revoked" });
});

developerRoutes.get("/subscription", requireAuth, async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;

  const apiSubscriptionService = new ApiSubscriptionService(db);
  const subscription =
    await apiSubscriptionService.getActiveSubscription(userId);

  if (!subscription) {
    return c.json({ success: false, subscription: null });
  }

  return c.json({ success: true, subscription });
});

developerRoutes.get("/subscriptions", requireAuth, async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;

  const apiSubscriptionService = new ApiSubscriptionService(db);
  const subscriptions =
    await apiSubscriptionService.getSubscriptionsByUserId(userId);

  return c.json({ success: true, subscriptions });
});

developerRoutes.post("/subscription/cancel", requireAuth, async (c) => {
  const db = c.get("db") as Database;
  const userId = c.get("userId") as string;

  const apiSubscriptionService = new ApiSubscriptionService(db);
  const subscription =
    await apiSubscriptionService.getActiveSubscription(userId);

  if (!subscription) {
    return c.json({ success: false, error: "No active subscription" }, 404);
  }

  const cancelled = await apiSubscriptionService.cancelSubscription(
    subscription.id,
    userId
  );

  if (!cancelled) {
    return c.json(
      { success: false, error: "Failed to cancel subscription" },
      500
    );
  }

  return c.json({ success: true, message: "Subscription cancelled" });
});
