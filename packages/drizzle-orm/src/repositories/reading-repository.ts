import { eq, desc, and, count, sql } from "drizzle-orm";

import type { Database } from "../client";

import { readings, type NewReading, type Reading } from "../schemas/readings";

export interface FindReadingsOptions {
  userId: string;
  type?: "potensi" | "peluang" | "compatibility";
  limit?: number;
  offset?: number;
}

export interface ListReadingsOptions {
  page: number;
  limit: number;
  userId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
    targetDate: string
  ): Promise<Reading | null> {
    const result = await this.db
      .select()
      .from(readings)
      .where(
        and(
          eq(readings.userId, userId),
          eq(readings.type, type),
          eq(readings.targetDate, targetDate)
        )
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

  async list(options: ListReadingsOptions): Promise<PaginatedResult<Reading>> {
    const { page, limit, userId } = options;
    const offset = (page - 1) * limit;

    let query = this.db.select().from(readings).$dynamic();
    let countQuery = this.db
      .select({ count: count() })
      .from(readings)
      .$dynamic();

    if (userId) {
      query = query.where(eq(readings.userId, userId));
      countQuery = countQuery.where(eq(readings.userId, userId));
    }

    const [data, totalResult] = await Promise.all([
      query.orderBy(desc(readings.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(): Promise<{
    total: number;
    potensi: number;
    peluang: number;
    compatibility: number;
    todayNew: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.db
      .select({
        total: count(),
        potensi: sql<number>`COUNT(*) FILTER (WHERE ${readings.type} = 'potensi')`,
        peluang: sql<number>`COUNT(*) FILTER (WHERE ${readings.type} = 'peluang')`,
        compatibility: sql<number>`COUNT(*) FILTER (WHERE ${readings.type} = 'compatibility')`,
        todayNew: sql<number>`COUNT(*) FILTER (WHERE ${readings.createdAt} >= ${today})`,
      })
      .from(readings);

    return {
      total: result[0]?.total ?? 0,
      potensi: Number(result[0]?.potensi ?? 0),
      peluang: Number(result[0]?.peluang ?? 0),
      compatibility: Number(result[0]?.compatibility ?? 0),
      todayNew: Number(result[0]?.todayNew ?? 0),
    };
  }
}
