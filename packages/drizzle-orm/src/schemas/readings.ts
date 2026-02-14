import { text, pgTable, index, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const readings = pgTable(
  "readings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["potensi", "peluang", "compatibility"],
    }).notNull(),
    targetDate: text("target_date").notNull(),
    birthDate: text("birth_date"),
    birthDate2: text("birth_date_2"),
    readingData: jsonb("reading_data").notNull(),
    txSignature: text("tx_signature"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("readings_user_idx").on(table.userId),
    index("readings_type_idx").on(table.type),
    index("readings_date_idx").on(table.targetDate),
  ],
);

export type Reading = typeof readings.$inferSelect;
export type NewReading = typeof readings.$inferInsert;
