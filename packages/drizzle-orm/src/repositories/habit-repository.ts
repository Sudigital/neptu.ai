import { eq, and, desc, asc } from "drizzle-orm";

import type { Database } from "../client";

import { habits, type NewHabit, type Habit } from "../schemas/habits";

export class HabitRepository {
  constructor(private db: Database) {}

  async create(data: NewHabit): Promise<Habit> {
    const now = new Date();
    await this.db.insert(habits).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) throw new Error("Failed to create habit");
    return result;
  }

  async findById(id: string): Promise<Habit | null> {
    const result = await this.db
      .select()
      .from(habits)
      .where(eq(habits.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserId(
    userId: string,
    status?: "active" | "archived" | "deleted"
  ): Promise<Habit[]> {
    if (status) {
      return this.db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, userId), eq(habits.status, status)))
        .orderBy(asc(habits.sortOrder), desc(habits.createdAt));
    }
    return this.db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(asc(habits.sortOrder), desc(habits.createdAt));
  }

  async update(
    id: string,
    data: Partial<Omit<NewHabit, "id">>
  ): Promise<Habit | null> {
    await this.db
      .update(habits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(habits.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(habits).where(eq(habits.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.status, "active")));
    return result.length;
  }
}
