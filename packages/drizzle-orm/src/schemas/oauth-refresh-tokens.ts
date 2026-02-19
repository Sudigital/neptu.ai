import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { oauthAccessTokens } from "./oauth-access-tokens";
import { oauthClients } from "./oauth-clients";
import { users } from "./users";

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    accessTokenId: text("access_token_id")
      .notNull()
      .references(() => oauthAccessTokens.id),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id),
    /** Null for client_credentials grant */
    userId: text("user_id").references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("oauth_refresh_tokens_hash_idx").on(table.tokenHash),
    index("oauth_refresh_tokens_access_idx").on(table.accessTokenId),
    index("oauth_refresh_tokens_client_idx").on(table.clientId),
    index("oauth_refresh_tokens_user_idx").on(table.userId),
  ]
);

export type OAuthRefreshToken = typeof oauthRefreshTokens.$inferSelect;
export type NewOAuthRefreshToken = typeof oauthRefreshTokens.$inferInsert;
