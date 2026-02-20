import { zValidator } from "@hono/zod-validator";
import {
  UserService,
  ReadingService,
  ApiPricingPlanService,
  ApiSubscriptionService,
  ApiUsageService,
  ApiKeyService,
  ApiCreditPackService,
  type Database,
  createApiPricingPlanSchema,
  updateApiPricingPlanSchema,
  createApiCreditPackSchema,
  updateApiCreditPackSchema,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import {
  dynamicJwtAuth,
  type DynamicJwtAuthEnv,
} from "../../middleware/dynamic-jwt-auth";

type Env = DynamicJwtAuthEnv & {
  Variables: DynamicJwtAuthEnv["Variables"] & {
    db: Database;
    adminWalletAddress: string | undefined;
  };
};

export const adminRoutes = new Hono<Env>();

// Admin middleware — verify Dynamic JWT then compare wallet with ADMIN_WALLET_ADDRESS
adminRoutes.use("/*", dynamicJwtAuth);
adminRoutes.use("/*", async (c, next) => {
  const walletAddress = c.get("walletAddress");
  const adminWalletAddress = c.get("adminWalletAddress");

  if (!walletAddress || !adminWalletAddress) {
    return c.json({ success: false, error: "Admin access required" }, 403);
  }

  if (walletAddress !== adminWalletAddress) {
    return c.json({ success: false, error: "Admin access required" }, 403);
  }

  await next();
});

// ============ DASHBOARD STATS ============

adminRoutes.get("/stats", async (c) => {
  const db = c.get("db");
  const userService = new UserService(db);
  const readingService = new ReadingService(db);
  const subscriptionService = new ApiSubscriptionService(db);
  const usageService = new ApiUsageService(db);

  const [userStats, readingStats, subscriptionStats, usageStats] =
    await Promise.all([
      userService.getStats(),
      readingService.getStats(),
      subscriptionService.getStats(),
      usageService.getStats(),
    ]);

  return c.json({
    success: true,
    stats: {
      users: userStats,
      readings: readingStats,
      subscriptions: subscriptionStats,
      usage: usageStats,
    },
  });
});

// ============ USER MANAGEMENT ============

const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "walletAddress", "displayName"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

adminRoutes.get("/users", zValidator("query", listUsersSchema), async (c) => {
  const { page, limit, search, sortBy, sortOrder } = c.req.valid("query");
  const db = c.get("db");
  const userService = new UserService(db);

  const result = await userService.listUsers({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });

  return c.json({ success: true, ...result });
});

adminRoutes.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const userService = new UserService(db);

  const user = await userService.getUserById(id);
  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({ success: true, user });
});

const updateUserAdminSchema = z.object({
  role: z.enum(["admin", "developer", "user"]).optional(),
  displayName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
});

adminRoutes.put(
  "/users/:id",
  zValidator("json", updateUserAdminSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = c.get("db");
    const userService = new UserService(db);

    if (body.role !== undefined) {
      await userService.setRole(id, body.role);
    }

    const user = await userService.updateUser(id, {
      displayName: body.displayName,
      email: body.email,
    });

    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    return c.json({ success: true, user });
  }
);

// ============ API SUBSCRIPTIONS ============

const listSubscriptionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["active", "cancelled", "expired", "past_due"]).optional(),
  planId: z.string().uuid().optional(),
});

adminRoutes.get(
  "/subscriptions",
  zValidator("query", listSubscriptionsSchema),
  async (c) => {
    const { page, limit, status, planId } = c.req.valid("query");
    const db = c.get("db");
    const subscriptionService = new ApiSubscriptionService(db);

    const result = await subscriptionService.listSubscriptions({
      page,
      limit,
      status,
      planId,
    });

    return c.json({ success: true, ...result });
  }
);

adminRoutes.get("/subscriptions/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const subscriptionService = new ApiSubscriptionService(db);

  const subscription = await subscriptionService.getSubscriptionById(id);
  if (!subscription) {
    return c.json({ success: false, error: "Subscription not found" }, 404);
  }

  return c.json({ success: true, subscription });
});

const updateSubscriptionSchema = z.object({
  status: z.enum(["active", "cancelled", "expired", "past_due"]).optional(),
  creditsRemaining: z.number().min(0).optional(),
});

adminRoutes.put(
  "/subscriptions/:id",
  zValidator("json", updateSubscriptionSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = c.get("db");
    const subscriptionService = new ApiSubscriptionService(db);

    const subscription = await subscriptionService.updateSubscription(id, body);
    if (!subscription) {
      return c.json({ success: false, error: "Subscription not found" }, 404);
    }

    return c.json({ success: true, subscription });
  }
);

// ============ API USAGE ANALYTICS ============

const usageAnalyticsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
});

adminRoutes.get(
  "/analytics/usage",
  zValidator("query", usageAnalyticsSchema),
  async (c) => {
    const { startDate, endDate, groupBy } = c.req.valid("query");
    const db = c.get("db");
    const usageService = new ApiUsageService(db);

    const analytics = await usageService.getAnalytics({
      startDate,
      endDate,
      groupBy,
    });

    return c.json({ success: true, analytics });
  }
);

adminRoutes.get("/analytics/endpoints", async (c) => {
  const db = c.get("db");
  const usageService = new ApiUsageService(db);

  const topEndpoints = await usageService.getTopEndpoints(10);

  return c.json({ success: true, endpoints: topEndpoints });
});

// ============ API PRICING PLANS ============

adminRoutes.get("/plans", async (c) => {
  const db = c.get("db");
  const planService = new ApiPricingPlanService(db);

  const plans = await planService.getAllPlans();

  return c.json({ success: true, plans });
});

adminRoutes.post(
  "/plans",
  zValidator("json", createApiPricingPlanSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = c.get("db");
    const planService = new ApiPricingPlanService(db);

    const plan = await planService.createPlan(body);

    return c.json({ success: true, plan }, 201);
  }
);

adminRoutes.put(
  "/plans/:id",
  zValidator("json", updateApiPricingPlanSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = c.get("db");
    const planService = new ApiPricingPlanService(db);

    const plan = await planService.updatePlan(id, body);
    if (!plan) {
      return c.json({ success: false, error: "Plan not found" }, 404);
    }

    return c.json({ success: true, plan });
  }
);

adminRoutes.delete("/plans/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const planService = new ApiPricingPlanService(db);

  const success = await planService.deletePlan(id);
  if (!success) {
    return c.json({ success: false, error: "Plan not found" }, 404);
  }

  return c.json({ success: true });
});

// ============ CREDIT PACKS ============

adminRoutes.get("/credit-packs", async (c) => {
  const db = c.get("db");
  const packService = new ApiCreditPackService(db);

  const packs = await packService.getAllPacks();

  return c.json({ success: true, packs });
});

adminRoutes.post(
  "/credit-packs",
  zValidator("json", createApiCreditPackSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = c.get("db");
    const packService = new ApiCreditPackService(db);

    const pack = await packService.createPack(body);

    return c.json({ success: true, pack }, 201);
  }
);

adminRoutes.put(
  "/credit-packs/:id",
  zValidator("json", updateApiCreditPackSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = c.get("db");
    const packService = new ApiCreditPackService(db);

    const pack = await packService.updatePack(id, body);
    if (!pack) {
      return c.json({ success: false, error: "Pack not found" }, 404);
    }

    return c.json({ success: true, pack });
  }
);

adminRoutes.delete("/credit-packs/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const packService = new ApiCreditPackService(db);

  const success = await packService.deletePack(id);
  if (!success) {
    return c.json({ success: false, error: "Pack not found" }, 404);
  }

  return c.json({ success: true });
});

// ============ API KEYS MANAGEMENT ============

const listApiKeysSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

adminRoutes.get(
  "/api-keys",
  zValidator("query", listApiKeysSchema),
  async (c) => {
    const { page, limit, userId, isActive } = c.req.valid("query");
    const db = c.get("db");
    const keyService = new ApiKeyService(db);

    const result = await keyService.listKeys({
      page,
      limit,
      userId,
      isActive,
    });

    return c.json({ success: true, ...result });
  }
);

adminRoutes.put("/api-keys/:id/revoke", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const keyService = new ApiKeyService(db);

  const success = await keyService.revokeKey(id);
  if (!success) {
    return c.json({ success: false, error: "API key not found" }, 404);
  }

  return c.json({ success: true });
});

// ============ READINGS ============

const listReadingsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
});

adminRoutes.get(
  "/readings",
  zValidator("query", listReadingsSchema),
  async (c) => {
    const { page, limit, userId } = c.req.valid("query");
    const db = c.get("db");
    const readingService = new ReadingService(db);

    const result = await readingService.listReadings({
      page,
      limit,
      userId,
    });

    return c.json({ success: true, ...result });
  }
);

// ============ SYSTEM SETTINGS ============

adminRoutes.get("/settings", async (c) => {
  // Return system configuration (non-sensitive)
  return c.json({
    success: true,
    settings: {
      maintenanceMode: false,
      apiVersion: "v1",
      features: {
        oracleEnabled: true,
        p2pEnabled: false,
        stakingEnabled: false,
      },
    },
  });
});
