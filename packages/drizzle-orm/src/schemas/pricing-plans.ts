import {
  text,
  pgTable,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const pricingPlans = pgTable("pricing_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Free", "Basic", "Premium"
  slug: text("slug").notNull().unique(), // e.g., "free", "basic", "premium"
  description: text("description"),
  priceUsd: numeric("price_usd").notNull().default("0"), // Monthly price in USD
  priceSol: numeric("price_sol"), // Price in SOL (optional, calculated)
  priceNeptu: numeric("price_neptu"), // Price in NEPTU tokens (optional)
  priceSudigital: numeric("price_sudigital"), // Price in SUDIGITAL tokens (optional)
  features: jsonb("features").notNull(), // JSON array of feature strings
  limits: jsonb("limits").notNull(), // JSON object: { dailyReadings: 1, oracleChats: 5, ... }
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

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type NewPricingPlan = typeof pricingPlans.$inferInsert;
