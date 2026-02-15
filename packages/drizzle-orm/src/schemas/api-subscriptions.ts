import {
  text,
  pgTable,
  index,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

import { apiPricingPlans } from "./api-pricing-plans";
import { users } from "./users";

export const apiSubscriptions = pgTable(
  "api_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    planId: text("plan_id")
      .notNull()
      .references(() => apiPricingPlans.id),
    status: text("status").notNull().default("active"),
    creditsRemaining: integer("credits_remaining").notNull().default(0),
    aiCreditsRemaining: integer("ai_credits_remaining").notNull().default(0),
    billingCycleStart: timestamp("billing_cycle_start", {
      withTimezone: true,
    }).notNull(),
    billingCycleEnd: timestamp("billing_cycle_end", {
      withTimezone: true,
    }).notNull(),
    paymentMethod: text("payment_method"),
    paymentTxSignature: text("payment_tx_signature"),
    metadata: jsonb("metadata"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("api_subscriptions_user_idx").on(table.userId),
    index("api_subscriptions_plan_idx").on(table.planId),
    index("api_subscriptions_status_idx").on(table.status),
  ]
);

export type ApiSubscription = typeof apiSubscriptions.$inferSelect;
export type NewApiSubscription = typeof apiSubscriptions.$inferInsert;
