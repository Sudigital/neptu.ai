import {
  text,
  pgTable,
  index,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

import { apiKeys } from "./api-keys";

export const apiUsage = pgTable(
  "api_usage",
  {
    id: text("id").primaryKey(),
    apiKeyId: text("api_key_id")
      .notNull()
      .references(() => apiKeys.id),
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull(),
    creditsUsed: integer("credits_used").notNull().default(1),
    isAiEndpoint: text("is_ai_endpoint").notNull().default("false"),
    responseStatus: integer("response_status"),
    responseTimeMs: integer("response_time_ms"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("api_usage_key_idx").on(table.apiKeyId),
    index("api_usage_endpoint_idx").on(table.endpoint),
    index("api_usage_created_idx").on(table.createdAt),
  ]
);

export type ApiUsage = typeof apiUsage.$inferSelect;
export type NewApiUsage = typeof apiUsage.$inferInsert;
