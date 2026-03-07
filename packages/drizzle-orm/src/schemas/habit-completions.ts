import {
  text,
  pgTable,
  index,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { habits } from "./habits";
import { users } from "./users";

export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: text("id").primaryKey(),
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    count: integer("count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("habit_completions_habit_idx").on(table.habitId),
    index("habit_completions_user_idx").on(table.userId),
    index("habit_completions_date_idx").on(table.date),
    index("habit_completions_user_date_idx").on(table.userId, table.date),
    unique("habit_completions_habit_date_uniq").on(table.habitId, table.date),
  ]
);

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type NewHabitCompletion = typeof habitCompletions.$inferInsert;
