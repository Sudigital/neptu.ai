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
} from "drizzle-orm/pg-core";

/**
 * Billionaire Daily Summary — one row per day.
 * Aggregates all billionaire snapshots for trend analysis:
 * total wealth, daily change, Neptu sentiment, top movers.
 */
export const billionaireDailySummaries = pgTable(
  "billionaire_daily_summaries",
  {
    id: serial("id").primaryKey(),
    summaryDate: date("summary_date").notNull(),

    /* Aggregate Forbes data */
    billionaireCount: integer("billionaire_count").notNull(),
    totalNetWorthBillions: doublePrecision(
      "total_net_worth_billions"
    ).notNull(),
    totalDailyChangeBillions: doublePrecision("total_daily_change_billions"),
    avgNetWorthBillions: doublePrecision("avg_net_worth_billions"),

    /* Aggregate Neptu scores (0–100) */
    avgProsperityScore: doublePrecision("avg_prosperity_score"),
    avgDailyEnergyScore: doublePrecision("avg_daily_energy_score"),
    avgUripPeluangScore: doublePrecision("avg_urip_peluang_score"),
    avgCompatibilityScore: doublePrecision("avg_compatibility_score"),
    neptuSentimentScore: doublePrecision("neptu_sentiment_score"),

    /* Top movers (references persons.id) */
    topGainerId: text("top_gainer_id"),
    topGainerChange: doublePrecision("top_gainer_change"),
    topLoserId: text("top_loser_id"),
    topLoserChange: doublePrecision("top_loser_change"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("billionaire_daily_summary_date_uniq").on(table.summaryDate),
    index("billionaire_daily_summary_date_idx").on(table.summaryDate),
  ]
);

export type BillionaireDailySummary =
  typeof billionaireDailySummaries.$inferSelect;
export type NewBillionaireDailySummary =
  typeof billionaireDailySummaries.$inferInsert;
