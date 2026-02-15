import {
  text,
  pgTable,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const apiPricingPlans = pgTable("api_pricing_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  tier: text("tier").notNull(), // "starter" | "pro" | "business" | "enterprise"
  priceUsd: numeric("price_usd").notNull().default("0"),
  priceSol: numeric("price_sol"),
  priceNeptu: numeric("price_neptu"),
  billingPeriod: text("billing_period").notNull().default("monthly"), // "monthly" | "yearly"
  features: jsonb("features").notNull(),
  limits: jsonb("limits").notNull(),
  overageRates: jsonb("overage_rates").notNull(),
  discountPercent: integer("discount_percent").default(0),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ApiPricingPlan = typeof apiPricingPlans.$inferSelect;
export type NewApiPricingPlan = typeof apiPricingPlans.$inferInsert;
