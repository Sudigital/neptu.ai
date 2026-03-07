import {
  text,
  pgTable,
  index,
  integer,
  doublePrecision,
  serial,
  date,
  timestamp,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

import { persons } from "./persons";

export interface ForbesFinancialAsset {
  exchange: string;
  ticker: string;
  companyName: string;
  numberOfShares: number;
  sharePrice: number;
  currencyCode: string;
  exchangeRate: number;
  interactive: boolean;
  currentPrice: number;
  exerciseOptionPrice?: number;
}

export const billionaireSnapshots = pgTable(
  "billionaire_snapshots",
  {
    id: serial("id").primaryKey(),
    figureId: text("figure_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date").notNull(),

    /* Forbes wealth data */
    forbesRank: integer("forbes_rank"),
    netWorthBillions: doublePrecision("net_worth_billions").notNull(),
    dailyChangeBillions: doublePrecision("daily_change_billions"),
    privateAssetsWorth: doublePrecision("private_assets_worth"),
    country: text("country"),
    industry: text("industry"),
    wealthSource: text("wealth_source"),
    financialAssets: jsonb("financial_assets")
      .$type<ForbesFinancialAsset[]>()
      .default([]),

    /* Neptu astrology scores (0–100) */
    prosperityScore: doublePrecision("prosperity_score"),
    dailyEnergyScore: doublePrecision("daily_energy_score"),
    uripPeluangScore: doublePrecision("urip_peluang_score"),
    compatibilityScore: doublePrecision("compatibility_score"),
    neptuAlphaScore: doublePrecision("neptu_alpha_score"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("billionaire_snapshot_figure_date_uniq").on(
      table.figureId,
      table.snapshotDate
    ),
    index("billionaire_snapshot_date_idx").on(table.snapshotDate),
    index("billionaire_snapshot_figure_idx").on(table.figureId),
    index("billionaire_snapshot_rank_idx").on(table.forbesRank),
  ]
);

export type BillionaireSnapshot = typeof billionaireSnapshots.$inferSelect;
export type NewBillionaireSnapshot = typeof billionaireSnapshots.$inferInsert;
