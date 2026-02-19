import type { OAuthGrantType, OAuthScope } from "@neptu/shared";

import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    clientId: text("client_id").notNull().unique(),
    clientSecretHash: text("client_secret_hash").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
    scopes: jsonb("scopes").$type<OAuthScope[]>().notNull(),
    grantTypes: jsonb("grant_types").$type<OAuthGrantType[]>().notNull(),
    isConfidential: boolean("is_confidential").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("oauth_clients_user_idx").on(table.userId),
    index("oauth_clients_client_id_idx").on(table.clientId),
  ]
);

export type OAuthClient = typeof oauthClients.$inferSelect;
export type NewOAuthClient = typeof oauthClients.$inferInsert;
