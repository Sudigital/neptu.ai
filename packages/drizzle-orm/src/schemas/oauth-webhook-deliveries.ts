import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { oauthWebhooks } from "./oauth-webhooks";

export const oauthWebhookDeliveries = pgTable(
  "oauth_webhook_deliveries",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => oauthWebhooks.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    status: text("status").notNull().default("pending"),
    httpStatus: integer("http_status"),
    responseBody: text("response_body"),
    attempts: integer("attempts").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("oauth_webhook_deliveries_webhook_id_idx").on(table.webhookId),
    index("oauth_webhook_deliveries_status_idx").on(table.status),
    index("oauth_webhook_deliveries_event_idx").on(table.event),
  ]
);

export type OAuthWebhookDelivery = typeof oauthWebhookDeliveries.$inferSelect;
export type NewOAuthWebhookDelivery =
  typeof oauthWebhookDeliveries.$inferInsert;
