import { text, pgTable, index, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userRewards = pgTable(
  "user_rewards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rewardType: text("reward_type", {
      enum: [
        "daily_check_in",
        "streak_bonus",
        "first_reading",
        "referral",
        "referee_bonus",
        "social_share",
        "auspicious_day",
        "payment_reward",
      ],
    }).notNull(),
    neptuAmount: numeric("neptu_amount").notNull(),
    status: text("status", { enum: ["pending", "claimed", "expired"] })
      .notNull()
      .default("pending"),
    description: text("description"),
    claimTxSignature: text("claim_tx_signature"),
    expiresAt: text("expires_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    claimedAt: text("claimed_at"),
  },
  (table) => [
    index("user_rewards_user_idx").on(table.userId),
    index("user_rewards_status_idx").on(table.status),
    index("user_rewards_type_idx").on(table.rewardType),
  ],
);

export type UserReward = typeof userRewards.$inferSelect;
export type NewUserReward = typeof userRewards.$inferInsert;
