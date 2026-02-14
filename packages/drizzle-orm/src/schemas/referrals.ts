import { text, pgTable, index, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const referrals = pgTable(
  "referrals",
  {
    id: text("id").primaryKey(),
    referrerId: text("referrer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refereeId: text("referee_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    referrerRewardAmount: numeric("referrer_reward_amount"),
    refereeRewardAmount: numeric("referee_reward_amount"),
    referrerRewardPaid: text("referrer_reward_paid", {
      enum: ["pending", "paid"],
    })
      .notNull()
      .default("pending"),
    refereeRewardPaid: text("referee_reward_paid", {
      enum: ["pending", "paid"],
    })
      .notNull()
      .default("pending"),
    referrerRewardTxSignature: text("referrer_reward_tx_signature"),
    refereeRewardTxSignature: text("referee_reward_tx_signature"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: text("completed_at"),
  },
  (table) => [
    index("referrals_referrer_idx").on(table.referrerId),
    index("referrals_referee_idx").on(table.refereeId),
  ],
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
