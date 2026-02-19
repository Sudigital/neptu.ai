import type { OAuthCodeChallengeMethod, OAuthScope } from "@neptu/shared";

import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { oauthClients } from "./oauth-clients";
import { users } from "./users";

export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: text("id").primaryKey(),
    codeHash: text("code_hash").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    redirectUri: text("redirect_uri").notNull(),
    scopes: jsonb("scopes").$type<OAuthScope[]>().notNull(),
    codeChallenge: text("code_challenge").notNull(),
    codeChallengeMethod: text("code_challenge_method")
      .$type<OAuthCodeChallengeMethod>()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("oauth_auth_codes_hash_idx").on(table.codeHash),
    index("oauth_auth_codes_client_idx").on(table.clientId),
    index("oauth_auth_codes_user_idx").on(table.userId),
  ]
);

export type OAuthAuthorizationCode =
  typeof oauthAuthorizationCodes.$inferSelect;
export type NewOAuthAuthorizationCode =
  typeof oauthAuthorizationCodes.$inferInsert;
