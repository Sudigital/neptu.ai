import {
  text,
  pgTable,
  index,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    walletAddress: text("wallet_address").notNull().unique(),
    email: text("email"),
    displayName: text("display_name"),
    birthDate: text("birth_date"), // Stored securely, never exposed in public APIs
    interests: jsonb("interests"), // JSON array: ["career", "love", "health", ...]
    onboarded: boolean("onboarded").default(false),
    isAdmin: boolean("is_admin").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_wallet_idx").on(table.walletAddress)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
