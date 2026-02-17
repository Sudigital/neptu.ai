import {
  ApiPricingPlanService,
  ApiCreditPackService,
  type Database,
} from "@neptu/drizzle-orm";
import { Hono } from "hono";

type Env = {
  Variables: { db: Database };
};

export const apiPricingRoutes = new Hono<Env>();

apiPricingRoutes.get("/plans", async (c) => {
  const db = c.get("db");
  const pricingService = new ApiPricingPlanService(db);

  const plans = await pricingService.getActivePlans();
  return c.json({ success: true, plans });
});

apiPricingRoutes.get("/plans/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = c.get("db");
  const pricingService = new ApiPricingPlanService(db);

  const plan = await pricingService.getPlanBySlug(slug);

  if (!plan) {
    return c.json({ success: false, error: "Plan not found" }, 404);
  }

  return c.json({ success: true, plan });
});

apiPricingRoutes.get("/credit-packs", async (c) => {
  const db = c.get("db");
  const creditPackService = new ApiCreditPackService(db);

  const packs = await creditPackService.getActivePacks();
  return c.json({ success: true, packs });
});

apiPricingRoutes.get("/credit-packs/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = c.get("db");
  const creditPackService = new ApiCreditPackService(db);

  const pack = await creditPackService.getPackBySlug(slug);

  if (!pack) {
    return c.json({ success: false, error: "Credit pack not found" }, 404);
  }

  return c.json({ success: true, pack });
});
