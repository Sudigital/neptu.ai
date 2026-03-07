import type {
  PersonCategory,
  PersonGender,
  PersonSource,
  PersonStatus,
  PersonTag,
} from "@neptu/shared";

import {
  text,
  pgTable,
  index,
  integer,
  timestamp,
  jsonb,
  unique,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const persons = pgTable(
  "persons",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    lastName: text("last_name"),
    slug: text("slug"),
    birthday: text("birthday").notNull(),
    gender: text("gender").$type<PersonGender>(),
    categories: jsonb("categories")
      .$type<PersonCategory[]>()
      .notNull()
      .default(["world_leader"]),
    nationality: text("nationality"),
    title: text("title"),
    description: text("description"),
    imageUrl: text("image_url"),
    thumbnailUrl: text("thumbnail_url"),
    wikidataId: text("wikidata_id"),
    wikipediaUrl: text("wikipedia_url"),
    tags: jsonb("tags").$type<PersonTag[]>().default([]),
    popularity: integer("popularity"),
    source: text("source").$type<PersonSource>().notNull().default("manual"),
    sourceUrl: text("source_url"),
    wukuData: jsonb("wuku_data").$type<Record<string, unknown>>(),

    /* Geographic */
    city: text("city"),
    state: text("state"),

    /* Rich content */
    bios: jsonb("bios").$type<string[]>(),
    abouts: jsonb("abouts").$type<string[]>(),
    industries: jsonb("industries").$type<string[]>(),

    /* Cached Forbes data (denormalized for fast list/sort) */
    netWorthBillions: doublePrecision("net_worth_billions"),
    forbesRank: integer("forbes_rank"),

    status: text("status").$type<PersonStatus>().notNull().default("active"),
    crawledAt: timestamp("crawled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("persons_birthday_idx").on(table.birthday),
    index("persons_status_idx").on(table.status),
    index("persons_source_idx").on(table.source),
    index("persons_wikidata_idx").on(table.wikidataId),
    index("persons_slug_idx").on(table.slug),
    index("persons_forbes_rank_idx").on(table.forbesRank),
    unique("persons_wikidata_uniq").on(table.wikidataId),
    unique("persons_name_uniq").on(table.name),
    unique("persons_slug_uniq").on(table.slug),
  ]
);

export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
