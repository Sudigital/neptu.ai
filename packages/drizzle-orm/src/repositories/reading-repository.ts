import { eq, desc, and } from "drizzle-orm";
import type { Database } from "../client";
import { readings, type NewReading, type Reading } from "../schemas/readings";

export interface FindReadingsOptions {
  userId: string;
  type?: "potensi" | "peluang" | "compatibility";
  limit?: number;
  offset?: number;
}

export class ReadingRepository {
  constructor(private db: Database) {}

  async create(data: Omit<NewReading, "id">): Promise<Reading> {
    const id = crypto.randomUUID();
    const result = await this.db
      .insert(readings)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  async findById(id: string): Promise<Reading | null> {
    const result = await this.db
      .select()
      .from(readings)
      .where(eq(readings.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUser(options: FindReadingsOptions): Promise<Reading[]> {
    const { userId, type, limit = 50, offset = 0 } = options;

    const conditions = [eq(readings.userId, userId)];
    if (type) {
      conditions.push(eq(readings.type, type));
    }

    return this.db
      .select()
      .from(readings)
      .where(and(...conditions))
      .orderBy(desc(readings.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findByUserAndDate(
    userId: string,
    type: "potensi" | "peluang" | "compatibility",
    targetDate: string,
  ): Promise<Reading | null> {
    const result = await this.db
      .select()
      .from(readings)
      .where(
        and(
          eq(readings.userId, userId),
          eq(readings.type, type),
          eq(readings.targetDate, targetDate),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(readings)
      .where(eq(readings.userId, userId));
    return result.length;
  }
}
