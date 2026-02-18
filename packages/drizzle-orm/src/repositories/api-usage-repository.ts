import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";

import type { Database } from "../client";

import {
  apiUsage,
  type NewApiUsage,
  type ApiUsage,
} from "../schemas/api-usage";

export interface UsageAnalyticsOptions {
  startDate: string;
  endDate: string;
  groupBy: "day" | "week" | "month";
}

export interface UsageAnalyticsPoint {
  date: string;
  totalCalls: number;
  basicCalls: number;
  aiCalls: number;
  creditsUsed: number;
}

export interface TopEndpoint {
  endpoint: string;
  method: string;
  totalCalls: number;
  avgResponseTime: number;
}

export class ApiUsageRepository {
  constructor(private db: Database) {}

  async create(data: NewApiUsage): Promise<ApiUsage> {
    const now = new Date();
    await this.db.insert(apiUsage).values({
      ...data,
      createdAt: data.createdAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create API usage record");
    }
    return result;
  }

  async findById(id: string): Promise<ApiUsage | null> {
    const result = await this.db
      .select()
      .from(apiUsage)
      .where(eq(apiUsage.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByApiKeyId(apiKeyId: string, limit = 100): Promise<ApiUsage[]> {
    return this.db
      .select()
      .from(apiUsage)
      .where(eq(apiUsage.apiKeyId, apiKeyId))
      .orderBy(desc(apiUsage.createdAt))
      .limit(limit);
  }

  async findByApiKeyIdInRange(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiUsage[]> {
    return this.db
      .select()
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.apiKeyId, apiKeyId),
          gte(apiUsage.createdAt, startDate),
          lte(apiUsage.createdAt, endDate)
        )
      )
      .orderBy(desc(apiUsage.createdAt));
  }

  async countByApiKeyIdInRange(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; basic: number; ai: number }> {
    const result = await this.db
      .select({
        total: count(),
        basic: sql<number>`COUNT(*) FILTER (WHERE ${apiUsage.isAiEndpoint} = 'false')`,
        ai: sql<number>`COUNT(*) FILTER (WHERE ${apiUsage.isAiEndpoint} = 'true')`,
      })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.apiKeyId, apiKeyId),
          gte(apiUsage.createdAt, startDate),
          lte(apiUsage.createdAt, endDate)
        )
      );

    return {
      total: result[0]?.total ?? 0,
      basic: Number(result[0]?.basic ?? 0),
      ai: Number(result[0]?.ai ?? 0),
    };
  }

  async sumCreditsUsedInRange(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${apiUsage.creditsUsed}), 0)`,
      })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.apiKeyId, apiKeyId),
          gte(apiUsage.createdAt, startDate),
          lte(apiUsage.createdAt, endDate)
        )
      );

    return Number(result[0]?.total ?? 0);
  }

  async getAverageResponseTime(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await this.db
      .select({
        avg: sql<number>`COALESCE(AVG(${apiUsage.responseTimeMs}), 0)`,
      })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.apiKeyId, apiKeyId),
          gte(apiUsage.createdAt, startDate),
          lte(apiUsage.createdAt, endDate)
        )
      );

    return Math.round(Number(result[0]?.avg ?? 0));
  }

  // Admin methods
  async getStats(): Promise<{
    totalCalls: number;
    todayCalls: number;
    totalCreditsUsed: number;
    avgResponseTime: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.db
      .select({
        totalCalls: count(),
        todayCalls: sql<number>`COUNT(*) FILTER (WHERE ${apiUsage.createdAt} >= ${today})`,
        totalCreditsUsed: sql<number>`COALESCE(SUM(${apiUsage.creditsUsed}), 0)`,
        avgResponseTime: sql<number>`COALESCE(AVG(${apiUsage.responseTimeMs}), 0)`,
      })
      .from(apiUsage);

    return {
      totalCalls: result[0]?.totalCalls ?? 0,
      todayCalls: Number(result[0]?.todayCalls ?? 0),
      totalCreditsUsed: Number(result[0]?.totalCreditsUsed ?? 0),
      avgResponseTime: Math.round(Number(result[0]?.avgResponseTime ?? 0)),
    };
  }

  async getAnalytics(
    options: UsageAnalyticsOptions
  ): Promise<UsageAnalyticsPoint[]> {
    const { startDate, endDate, groupBy } = options;
    const start = new Date(startDate);
    const end = new Date(endDate);

    let dateFormat;
    if (groupBy === "day") {
      dateFormat = sql`TO_CHAR(${apiUsage.createdAt}, 'YYYY-MM-DD')`;
    } else if (groupBy === "week") {
      dateFormat = sql`TO_CHAR(DATE_TRUNC('week', ${apiUsage.createdAt}), 'YYYY-MM-DD')`;
    } else {
      dateFormat = sql`TO_CHAR(DATE_TRUNC('month', ${apiUsage.createdAt}), 'YYYY-MM')`;
    }

    const result = await this.db
      .select({
        date: dateFormat,
        totalCalls: count(),
        basicCalls: sql<number>`COUNT(*) FILTER (WHERE ${apiUsage.isAiEndpoint} = 'false')`,
        aiCalls: sql<number>`COUNT(*) FILTER (WHERE ${apiUsage.isAiEndpoint} = 'true')`,
        creditsUsed: sql<number>`COALESCE(SUM(${apiUsage.creditsUsed}), 0)`,
      })
      .from(apiUsage)
      .where(and(gte(apiUsage.createdAt, start), lte(apiUsage.createdAt, end)))
      .groupBy(dateFormat)
      .orderBy(dateFormat);

    return result.map((row) => ({
      date: String(row.date),
      totalCalls: row.totalCalls,
      basicCalls: Number(row.basicCalls),
      aiCalls: Number(row.aiCalls),
      creditsUsed: Number(row.creditsUsed),
    }));
  }

  async getTopEndpoints(limit: number): Promise<TopEndpoint[]> {
    const result = await this.db
      .select({
        endpoint: apiUsage.endpoint,
        method: apiUsage.method,
        totalCalls: count(),
        avgResponseTime: sql<number>`COALESCE(AVG(${apiUsage.responseTimeMs}), 0)`,
      })
      .from(apiUsage)
      .groupBy(apiUsage.endpoint, apiUsage.method)
      .orderBy(desc(count()))
      .limit(limit);

    return result.map((row) => ({
      endpoint: row.endpoint,
      method: row.method,
      totalCalls: row.totalCalls,
      avgResponseTime: Math.round(Number(row.avgResponseTime)),
    }));
  }
}
