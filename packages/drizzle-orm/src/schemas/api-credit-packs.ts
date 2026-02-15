import {
  text,
  pgTable,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const apiCreditPacks = pgTable("api_credit_packs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  credits: integer("credits").notNull(),
  aiCredits: integer("ai_credits").notNull().default(0),
  priceUsd: numeric("price_usd").notNull(),
  priceSol: numeric("price_sol"),
  priceNeptu: numeric("price_neptu"),
  bonusPercent: integer("bonus_percent").default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ApiCreditPack = typeof apiCreditPacks.$inferSelect;
export type NewApiCreditPack = typeof apiCreditPacks.$inferInsert;
