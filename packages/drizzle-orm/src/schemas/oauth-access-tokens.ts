import type { OAuthScope } from "@neptu/shared";

import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { oauthClients } from "./oauth-clients";
import { users } from "./users";

export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: text("id").primaryKey(),
    /** JWT `jti` claim — SHA-256 hash of the token for revocation lookup */
    tokenHash: text("token_hash").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id),
    /** Null for client_credentials grant */
    userId: text("user_id").references(() => users.id),
    scopes: jsonb("scopes").$type<OAuthScope[]>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("oauth_access_tokens_hash_idx").on(table.tokenHash),
    index("oauth_access_tokens_client_idx").on(table.clientId),
    index("oauth_access_tokens_user_idx").on(table.userId),
  ]
);

export type OAuthAccessToken = typeof oauthAccessTokens.$inferSelect;
export type NewOAuthAccessToken = typeof oauthAccessTokens.$inferInsert;
