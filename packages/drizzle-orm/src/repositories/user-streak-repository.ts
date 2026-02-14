import { eq } from "drizzle-orm";
import type { Database } from "../client";
import {
  userStreaks,
  type NewUserStreak,
  type UserStreak,
} from "../schemas/user-streaks";

export class UserStreakRepository {
  constructor(private db: Database) {}

  async create(data: Omit<NewUserStreak, "id">): Promise<UserStreak> {
    const id = crypto.randomUUID();
    const result = await this.db
      .insert(userStreaks)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  async findByUserId(userId: string): Promise<UserStreak | null> {
    const result = await this.db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);
    return result[0] ?? null;
  }

  async getOrCreate(userId: string): Promise<UserStreak> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }
    return this.create({ userId });
  }

  async updateStreak(
    userId: string,
    currentStreak: number,
    longestStreak: number,
    lastCheckIn: string,
    totalCheckIns: number,
  ): Promise<UserStreak | null> {
    const now = new Date();
    const result = await this.db
      .update(userStreaks)
      .set({
        currentStreak,
        longestStreak,
        lastCheckIn,
        totalCheckIns,
        updatedAt: now,
      })
      .where(eq(userStreaks.userId, userId))
      .returning();
    return result[0] ?? null;
  }

  async resetStreak(userId: string): Promise<UserStreak | null> {
    const now = new Date();
    const result = await this.db
      .update(userStreaks)
      .set({
        currentStreak: 0,
        updatedAt: now,
      })
      .where(eq(userStreaks.userId, userId))
      .returning();
    return result[0] ?? null;
  }

  async incrementCheckIn(
    userId: string,
    newStreak: number,
    checkInDate: string,
  ): Promise<UserStreak | null> {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return null;
    }

    const longestStreak = Math.max(existing.longestStreak, newStreak);
    const totalCheckIns = existing.totalCheckIns + 1;
    const now = new Date();

    const result = await this.db
      .update(userStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastCheckIn: checkInDate,
        totalCheckIns,
        updatedAt: now,
      })
      .where(eq(userStreaks.userId, userId))
      .returning();
    return result[0] ?? null;
  }
}
