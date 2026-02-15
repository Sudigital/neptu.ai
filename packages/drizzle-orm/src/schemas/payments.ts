import { text, pgTable, index, numeric, timestamp } from "drizzle-orm/pg-core";

import { users } from "./users";

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readingId: text("reading_id"),
    paymentType: text("payment_type", {
      enum: ["sol", "neptu", "sudigital"],
    }).notNull(),
    amount: numeric("amount").notNull(),
    neptuReward: numeric("neptu_reward"),
    neptuBurned: numeric("neptu_burned"),
    txSignature: text("tx_signature").notNull().unique(),
    status: text("status", { enum: ["pending", "confirmed", "failed"] })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedAt: text("confirmed_at"),
  },
  (table) => [
    index("payments_user_idx").on(table.userId),
    index("payments_tx_idx").on(table.txSignature),
    index("payments_status_idx").on(table.status),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
