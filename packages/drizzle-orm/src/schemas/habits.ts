import type { HabitCategory, HabitFrequency, HabitStatus } from "@neptu/shared";

import {
  text,
  pgTable,
  index,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const habits = pgTable(
  "habits",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").default(""),
    category: text("category")
      .$type<HabitCategory>()
      .notNull()
      .default("health"),
    frequency: text("frequency")
      .$type<HabitFrequency>()
      .notNull()
      .default("daily"),
    targetCount: integer("target_count").notNull().default(1),
    scheduledTime: text("scheduled_time"),
    daysOfWeek: jsonb("days_of_week")
      .$type<number[]>()
      .default([0, 1, 2, 3, 4, 5, 6]),
    tokenReward: numeric("token_reward").notNull().default("0.1"),
    status: text("status").$type<HabitStatus>().notNull().default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("habits_user_idx").on(table.userId),
    index("habits_user_status_idx").on(table.userId, table.status),
    index("habits_category_idx").on(table.category),
  ]
);

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
