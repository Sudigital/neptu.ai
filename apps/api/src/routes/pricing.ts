import { zValidator } from "@hono/zod-validator";
import {
  PricingPlanService,
  UserService,
  type Database,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

type Env = {
  Variables: { db: Database; adminWalletAddress: string | undefined };
};

export const pricingRoutes = new Hono<Env>();

const planLimitsSchema = z.object({
  dailyReadings: z.number().int(),
  oracleChats: z.number().int(),
  customReadings: z.number().int(),
  advancedInsights: z.boolean(),
  prioritySupport: z.boolean(),
});

const createPlanSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  priceUsd: z.number().min(0),
  priceSol: z.number().min(0).optional(),
  priceNeptu: z.number().min(0).optional(),
  priceSudigital: z.number().min(0).optional(),
  features: z.array(z.string()),
  limits: planLimitsSchema,
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const updatePlanSchema = createPlanSchema.partial();

// Admin check middleware
const requireAdmin = async (
  c: {
    get: (key: string) => Database | string | undefined;
    req: { header: (name: string) => string | undefined };
    json: (data: unknown, status?: number) => Response;
  },
  next: () => Promise<void>
) => {
  const db = c.get("db") as Database;
  const adminWalletAddress = c.get("adminWalletAddress") as string | undefined;
  const walletAddress = c.req.header("X-Wallet-Address");

  if (!walletAddress) {
    return c.json({ success: false, error: "Wallet address required" }, 401);
  }

  const userService = new UserService(db);
  const user = await userService.getUserByWallet(walletAddress);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  // Check if user is admin (either by isAdmin flag or by matching admin wallet address)
  const isAdmin = user.isAdmin || walletAddress === adminWalletAddress;

  if (!isAdmin) {
    return c.json({ success: false, error: "Admin access required" }, 403);
  }

  await next();
};

/**
 * GET /api/pricing
 * Get active pricing plans (public)
 */
pricingRoutes.get("/", async (c) => {
  const db = c.get("db");
  const pricingService = new PricingPlanService(db);

  const plans = await pricingService.getActivePlans();

  return c.json({ success: true, plans });
});

/**
 * GET /api/pricing/:slug
 * Get pricing plan by slug (public)
 */
pricingRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = c.get("db");
  const pricingService = new PricingPlanService(db);

  const plan = await pricingService.getPlanBySlug(slug);

  if (!plan) {
    return c.json({ success: false, error: "Plan not found" }, 404);
  }

  return c.json({ success: true, plan });
});

/**
 * POST /api/pricing/seed
 * Seed default pricing plans (admin only)
 */
pricingRoutes.post("/seed", requireAdmin, async (c) => {
  const db = c.get("db");
  const pricingService = new PricingPlanService(db);

  await pricingService.seedDefaultPlans();

  const plans = await pricingService.getAllPlans();

  return c.json({ success: true, message: "Plans seeded", plans });
});

// ==================== Admin Routes ====================

/**
 * GET /api/pricing/admin/all
 * Get all pricing plans including inactive (admin only)
 */
pricingRoutes.get("/admin/all", requireAdmin, async (c) => {
  const db = c.get("db");
  const pricingService = new PricingPlanService(db);

  const plans = await pricingService.getAllPlans();

  return c.json({ success: true, plans });
});

/**
 * POST /api/pricing/admin
 * Create a new pricing plan (admin only)
 */
pricingRoutes.post(
  "/admin",
  requireAdmin,
  zValidator("json", createPlanSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = c.get("db");
    const pricingService = new PricingPlanService(db);

    // Check if slug already exists
    const existing = await pricingService.getPlanBySlug(body.slug);
    if (existing) {
      return c.json(
        { success: false, error: "Plan with this slug already exists" },
        400
      );
    }

    const plan = await pricingService.createPlan(body);

    return c.json({ success: true, plan }, 201);
  }
);

/**
 * PUT /api/pricing/admin/:id
 * Update a pricing plan (admin only)
 */
pricingRoutes.put(
  "/admin/:id",
  requireAdmin,
  zValidator("json", updatePlanSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = c.get("db");
    const pricingService = new PricingPlanService(db);

    // Check if plan exists
    const existing = await pricingService.getPlanById(id);
    if (!existing) {
      return c.json({ success: false, error: "Plan not found" }, 404);
    }

    // Check if slug is being changed and if it conflicts
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await pricingService.getPlanBySlug(body.slug);
      if (slugExists) {
        return c.json(
          { success: false, error: "Plan with this slug already exists" },
          400
        );
      }
    }

    const plan = await pricingService.updatePlan(id, body);

    return c.json({ success: true, plan });
  }
);

/**
 * DELETE /api/pricing/admin/:id
 * Delete a pricing plan (admin only)
 */
pricingRoutes.delete("/admin/:id", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const pricingService = new PricingPlanService(db);

  const deleted = await pricingService.deletePlan(id);

  if (!deleted) {
    return c.json({ success: false, error: "Plan not found" }, 404);
  }

  return c.json({ success: true, message: "Plan deleted" });
});
