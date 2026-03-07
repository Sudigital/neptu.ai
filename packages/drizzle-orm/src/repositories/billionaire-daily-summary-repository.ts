import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import type { Database } from "../client";

import {
  billionaireDailySummaries,
  type NewBillionaireDailySummary,
} from "../schemas/billionaire-daily-summaries";

export interface FindBillionaireSummariesOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class BillionaireDailySummaryRepository {
  constructor(private db: Database) {}

  async create(data: NewBillionaireDailySummary) {
    const [row] = await this.db
      .insert(billionaireDailySummaries)
      .values(data)
      .returning();
    return row;
  }

  async upsert(data: NewBillionaireDailySummary) {
    const [row] = await this.db
      .insert(billionaireDailySummaries)
      .values(data)
      .onConflictDoUpdate({
        target: [billionaireDailySummaries.summaryDate],
        set: {
          billionaireCount: data.billionaireCount,
          totalNetWorthBillions: data.totalNetWorthBillions,
          totalDailyChangeBillions: data.totalDailyChangeBillions,
          avgNetWorthBillions: data.avgNetWorthBillions,
          avgProsperityScore: data.avgProsperityScore,
          avgDailyEnergyScore: data.avgDailyEnergyScore,
          avgUripPeluangScore: data.avgUripPeluangScore,
          avgCompatibilityScore: data.avgCompatibilityScore,
          neptuSentimentScore: data.neptuSentimentScore,
          topGainerId: data.topGainerId,
          topGainerChange: data.topGainerChange,
          topLoserId: data.topLoserId,
          topLoserChange: data.topLoserChange,
        },
      })
      .returning();
    return row;
  }

  async findByDate(summaryDate: string) {
    const [row] = await this.db
      .select()
      .from(billionaireDailySummaries)
      .where(eq(billionaireDailySummaries.summaryDate, summaryDate))
      .limit(1);
    return row ?? null;
  }

  async findAll(options: FindBillionaireSummariesOptions = {}) {
    const conditions = [];
    if (options.startDate) {
      conditions.push(
        gte(billionaireDailySummaries.summaryDate, options.startDate)
      );
    }
    if (options.endDate) {
      conditions.push(
        lte(billionaireDailySummaries.summaryDate, options.endDate)
      );
    }

    return this.db
      .select()
      .from(billionaireDailySummaries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(billionaireDailySummaries.summaryDate))
      .limit(options.limit ?? 30)
      .offset(options.offset ?? 0);
  }

  async findLatest(limit = 30) {
    return this.db
      .select()
      .from(billionaireDailySummaries)
      .orderBy(desc(billionaireDailySummaries.summaryDate))
      .limit(limit);
  }

  async count() {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(billionaireDailySummaries);
    return result.count;
  }
}
