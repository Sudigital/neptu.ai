import {
  text,
  pgTable,
  index,
  primaryKey,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const dailyReadings = pgTable(
  "daily_readings",
  {
    date: text("date").notNull(),
    type: text("type", { enum: ["peluang"] }).notNull(),
    readingData: jsonb("reading_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.date, table.type] }),
    index("daily_readings_date_idx").on(table.date),
  ],
);

export type DailyReading = typeof dailyReadings.$inferSelect;
export type NewDailyReading = typeof dailyReadings.$inferInsert;
