import { eq, and, gte, lte, desc } from "drizzle-orm";

import type { Database } from "../client";

import {
  dailyReadings,
  type NewDailyReading,
  type DailyReading,
} from "../schemas/daily-readings";

export class DailyReadingRepository {
  constructor(private db: Database) {}

  async create(data: NewDailyReading): Promise<DailyReading> {
    const result = await this.db.insert(dailyReadings).values(data).returning();
    return result[0];
  }

  async upsert(data: NewDailyReading): Promise<DailyReading> {
    const existing = await this.findByDateAndType(data.date, data.type);
    if (existing) {
      const result = await this.db
        .update(dailyReadings)
        .set({ readingData: data.readingData })
        .where(
          and(
            eq(dailyReadings.date, data.date),
            eq(dailyReadings.type, data.type)
          )
        )
        .returning();
      return result[0];
    }
    return this.create(data);
  }

  async findByDateAndType(
    date: string,
    type: "peluang"
  ): Promise<DailyReading | null> {
    const result = await this.db
      .select()
      .from(dailyReadings)
      .where(and(eq(dailyReadings.date, date), eq(dailyReadings.type, type)))
      .limit(1);
    return result[0] ?? null;
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    type: "peluang"
  ): Promise<DailyReading[]> {
    return this.db
      .select()
      .from(dailyReadings)
      .where(
        and(
          eq(dailyReadings.type, type),
          gte(dailyReadings.date, startDate),
          lte(dailyReadings.date, endDate)
        )
      )
      .orderBy(desc(dailyReadings.date));
  }

  async deleteOlderThan(date: string): Promise<number> {
    const result = await this.db
      .delete(dailyReadings)
      .where(lte(dailyReadings.date, date))
      .returning();
    return result.length;
  }
}
