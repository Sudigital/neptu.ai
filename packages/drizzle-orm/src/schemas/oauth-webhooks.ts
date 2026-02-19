import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { oauthClients } from "./oauth-clients";
import { users } from "./users";

export const oauthWebhooks = pgTable(
  "oauth_webhooks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: jsonb("events").notNull().$type<string[]>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("oauth_webhooks_user_id_idx").on(table.userId),
    index("oauth_webhooks_client_id_idx").on(table.clientId),
  ]
);

export type OAuthWebhook = typeof oauthWebhooks.$inferSelect;
export type NewOAuthWebhook = typeof oauthWebhooks.$inferInsert;
