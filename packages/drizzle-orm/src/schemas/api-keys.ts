import {
  text,
  pgTable,
  index,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

import { apiPricingPlans } from "./api-pricing-plans";
import { users } from "./users";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    planId: text("plan_id").references(() => apiPricingPlans.id),
    scopes: jsonb("scopes").notNull(),
    allowedOrigins: jsonb("allowed_origins"),
    allowedIps: jsonb("allowed_ips"),
    isActive: boolean("is_active").default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("api_keys_user_idx").on(table.userId),
    index("api_keys_hash_idx").on(table.keyHash),
    index("api_keys_prefix_idx").on(table.keyPrefix),
  ]
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
