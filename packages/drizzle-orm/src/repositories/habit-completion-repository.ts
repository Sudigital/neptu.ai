import { eq, and, gte, lte, desc } from "drizzle-orm";

import type { Database } from "../client";

import {
  habitCompletions,
  type NewHabitCompletion,
  type HabitCompletion,
} from "../schemas/habit-completions";

export class HabitCompletionRepository {
  constructor(private db: Database) {}

  async create(data: NewHabitCompletion): Promise<HabitCompletion> {
    const now = new Date();
    await this.db.insert(habitCompletions).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) throw new Error("Failed to create habit completion");
    return result;
  }

  async findById(id: string): Promise<HabitCompletion | null> {
    const result = await this.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByHabitAndDate(
    habitId: string,
    date: string
  ): Promise<HabitCompletion | null> {
    const result = await this.db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.habitId, habitId),
          eq(habitCompletions.date, date)
        )
      )
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserAndDate(
    userId: string,
    date: string
  ): Promise<HabitCompletion[]> {
    return this.db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.userId, userId),
          eq(habitCompletions.date, date)
        )
      );
  }

  async findByUserDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitCompletion[]> {
    return this.db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.userId, userId),
          gte(habitCompletions.date, startDate),
          lte(habitCompletions.date, endDate)
        )
      )
      .orderBy(desc(habitCompletions.date));
  }

  async findByHabitId(habitId: string): Promise<HabitCompletion[]> {
    return this.db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.habitId, habitId))
      .orderBy(desc(habitCompletions.date));
  }

  async upsert(
    habitId: string,
    userId: string,
    date: string,
    count: number
  ): Promise<HabitCompletion> {
    const existing = await this.findByHabitAndDate(habitId, date);
    if (existing) {
      await this.db
        .update(habitCompletions)
        .set({ count: existing.count + count, updatedAt: new Date() })
        .where(eq(habitCompletions.id, existing.id));
      const updated = await this.findById(existing.id);
      if (!updated) throw new Error("Failed to update habit completion");
      return updated;
    }
    return this.create({
      id: crypto.randomUUID(),
      habitId,
      userId,
      date,
      count,
    });
  }

  async getStreakDates(habitId: string): Promise<string[]> {
    const completions = await this.db
      .select({ date: habitCompletions.date })
      .from(habitCompletions)
      .where(eq(habitCompletions.habitId, habitId))
      .orderBy(desc(habitCompletions.date));
    return completions.map((c) => c.date);
  }
}
