import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import type { Database } from "../client";

import {
  billionaireSnapshots,
  type NewBillionaireSnapshot,
} from "../schemas/billionaire-snapshots";

export interface FindBillionaireSnapshotsOptions {
  figureId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class BillionaireSnapshotRepository {
  constructor(private db: Database) {}

  async create(data: NewBillionaireSnapshot) {
    const [row] = await this.db
      .insert(billionaireSnapshots)
      .values(data)
      .returning();
    return row;
  }

  async createBatch(data: NewBillionaireSnapshot[]) {
    if (data.length === 0) return [];
    return this.db.insert(billionaireSnapshots).values(data).returning();
  }

  async upsert(data: NewBillionaireSnapshot) {
    const [row] = await this.db
      .insert(billionaireSnapshots)
      .values(data)
      .onConflictDoUpdate({
        target: [
          billionaireSnapshots.figureId,
          billionaireSnapshots.snapshotDate,
        ],
        set: {
          forbesRank: data.forbesRank,
          netWorthBillions: data.netWorthBillions,
          dailyChangeBillions: data.dailyChangeBillions,
          privateAssetsWorth: data.privateAssetsWorth,
          country: data.country,
          industry: data.industry,
          wealthSource: data.wealthSource,
          financialAssets: data.financialAssets,
          prosperityScore: data.prosperityScore,
          dailyEnergyScore: data.dailyEnergyScore,
          uripPeluangScore: data.uripPeluangScore,
          compatibilityScore: data.compatibilityScore,
          neptuAlphaScore: data.neptuAlphaScore,
        },
      })
      .returning();
    return row;
  }

  async upsertBatch(data: NewBillionaireSnapshot[]) {
    if (data.length === 0) return [];
    return this.db
      .insert(billionaireSnapshots)
      .values(data)
      .onConflictDoUpdate({
        target: [
          billionaireSnapshots.figureId,
          billionaireSnapshots.snapshotDate,
        ],
        set: {
          forbesRank: sql`EXCLUDED.forbes_rank`,
          netWorthBillions: sql`EXCLUDED.net_worth_billions`,
          dailyChangeBillions: sql`EXCLUDED.daily_change_billions`,
          privateAssetsWorth: sql`EXCLUDED.private_assets_worth`,
          country: sql`EXCLUDED.country`,
          industry: sql`EXCLUDED.industry`,
          wealthSource: sql`EXCLUDED.wealth_source`,
          financialAssets: sql`EXCLUDED.financial_assets`,
          prosperityScore: sql`EXCLUDED.prosperity_score`,
          dailyEnergyScore: sql`EXCLUDED.daily_energy_score`,
          uripPeluangScore: sql`EXCLUDED.urip_peluang_score`,
          compatibilityScore: sql`EXCLUDED.compatibility_score`,
          neptuAlphaScore: sql`EXCLUDED.neptu_alpha_score`,
        },
      })
      .returning();
  }

  async findByFigureAndDate(figureId: string, snapshotDate: string) {
    const [row] = await this.db
      .select()
      .from(billionaireSnapshots)
      .where(
        and(
          eq(billionaireSnapshots.figureId, figureId),
          eq(billionaireSnapshots.snapshotDate, snapshotDate)
        )
      )
      .limit(1);
    return row ?? null;
  }

  async findAll(options: FindBillionaireSnapshotsOptions = {}) {
    const conditions = [];
    if (options.figureId) {
      conditions.push(eq(billionaireSnapshots.figureId, options.figureId));
    }
    if (options.startDate) {
      conditions.push(
        gte(billionaireSnapshots.snapshotDate, options.startDate)
      );
    }
    if (options.endDate) {
      conditions.push(lte(billionaireSnapshots.snapshotDate, options.endDate));
    }

    return this.db
      .select()
      .from(billionaireSnapshots)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(billionaireSnapshots.snapshotDate))
      .limit(options.limit ?? 30)
      .offset(options.offset ?? 0);
  }

  async findLatestByFigure(figureId: string, limit = 30) {
    return this.db
      .select()
      .from(billionaireSnapshots)
      .where(eq(billionaireSnapshots.figureId, figureId))
      .orderBy(desc(billionaireSnapshots.snapshotDate))
      .limit(limit);
  }

  async findByDate(snapshotDate: string) {
    return this.db
      .select()
      .from(billionaireSnapshots)
      .where(eq(billionaireSnapshots.snapshotDate, snapshotDate))
      .orderBy(billionaireSnapshots.forbesRank);
  }

  async count(figureId?: string) {
    const conditions = figureId
      ? eq(billionaireSnapshots.figureId, figureId)
      : undefined;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(billionaireSnapshots)
      .where(conditions);
    return result.count;
  }

  async deleteByDate(snapshotDate: string) {
    return this.db
      .delete(billionaireSnapshots)
      .where(eq(billionaireSnapshots.snapshotDate, snapshotDate));
  }
}
