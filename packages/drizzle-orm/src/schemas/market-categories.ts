import type { MarketCategory, PersonTag } from "@neptu/shared";

import {
  text,
  pgTable,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const marketCategories = pgTable("market_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // lucide icon name, e.g. "bar-chart", "currency", "bitcoin"
  color: text("color"), // hex color, e.g. "#8b5cf6"
  category: text("category").$type<MarketCategory>().notNull(), // "crypto" | "forex" | "stock"
  personTags: jsonb("person_tags").$type<PersonTag[]>().notNull().default([]),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MarketCategoryRow = typeof marketCategories.$inferSelect;
export type NewMarketCategory = typeof marketCategories.$inferInsert;
