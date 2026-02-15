import { text, pgTable, index, numeric, timestamp } from "drizzle-orm/pg-core";

import { users } from "./users";

export const tokenTransactions = pgTable(
  "token_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    txSignature: text("tx_signature").notNull().unique(),
    transactionType: text("transaction_type", {
      enum: [
        "sol_payment",
        "neptu_payment",
        "sudigital_payment",
        "neptu_reward",
        "neptu_burn",
      ],
    }).notNull(),
    readingType: text("reading_type", {
      enum: ["POTENSI", "PELUANG", "AI_CHAT", "COMPATIBILITY"],
    }),
    solAmount: numeric("sol_amount"),
    neptuAmount: numeric("neptu_amount"),
    sudigitalAmount: numeric("sudigital_amount"),
    neptuBurned: numeric("neptu_burned"),
    neptuRewarded: numeric("neptu_rewarded"),
    status: text("status", { enum: ["pending", "confirmed", "failed"] })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedAt: text("confirmed_at"),
  },
  (table) => [
    index("token_tx_user_idx").on(table.userId),
    index("token_tx_signature_idx").on(table.txSignature),
    index("token_tx_status_idx").on(table.status),
    index("token_tx_type_idx").on(table.transactionType),
  ]
);

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type NewTokenTransaction = typeof tokenTransactions.$inferInsert;
