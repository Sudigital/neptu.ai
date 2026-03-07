import type { Database } from "../client";
import type { NewBillionaireDailySummary } from "../schemas/billionaire-daily-summaries";
import type { NewBillionaireSnapshot } from "../schemas/billionaire-snapshots";

import {
  toBillionaireDailySummaryDTO,
  toBillionaireDailySummaryDTOList,
} from "../dto/billionaire-daily-summary-dto";
import { toBillionaireSnapshotDTOList } from "../dto/billionaire-snapshot-dto";
import {
  BillionaireDailySummaryRepository,
  type FindBillionaireSummariesOptions,
} from "../repositories/billionaire-daily-summary-repository";
import {
  BillionaireSnapshotRepository,
  type FindBillionaireSnapshotsOptions,
} from "../repositories/billionaire-snapshot-repository";
import {
  listBillionaireSnapshotsSchema,
  listBillionaireDailySummariesSchema,
} from "../validators/billionaire-validator";

export interface BillionaireSnapshotBatch {
  snapshots: NewBillionaireSnapshot[];
  summary: NewBillionaireDailySummary;
}

export class BillionaireTrackingService {
  private snapshotRepo: BillionaireSnapshotRepository;
  private summaryRepo: BillionaireDailySummaryRepository;

  constructor(db: Database) {
    this.snapshotRepo = new BillionaireSnapshotRepository(db);
    this.summaryRepo = new BillionaireDailySummaryRepository(db);
  }

  /**
   * Upsert a full day's worth of billionaire snapshots + daily summary.
   * Idempotent — safe to re-run for the same date.
   */
  async recordDailySnapshots(batch: BillionaireSnapshotBatch) {
    const upserted = await this.snapshotRepo.upsertBatch(batch.snapshots);
    const summary = await this.summaryRepo.upsert(batch.summary);
    return {
      snapshotCount: upserted.length,
      summary: toBillionaireDailySummaryDTO(summary),
    };
  }

  async getSnapshots(input: unknown) {
    const parsed = listBillionaireSnapshotsSchema.parse(input);
    const options: FindBillionaireSnapshotsOptions = {
      figureId: parsed.figureId,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      limit: parsed.limit,
      offset: parsed.offset,
    };
    const rows = await this.snapshotRepo.findAll(options);
    return toBillionaireSnapshotDTOList(rows);
  }

  async getSnapshotsByFigure(figureId: string, limit = 30) {
    const rows = await this.snapshotRepo.findLatestByFigure(figureId, limit);
    return toBillionaireSnapshotDTOList(rows);
  }

  async getSnapshotsByDate(snapshotDate: string) {
    const rows = await this.snapshotRepo.findByDate(snapshotDate);
    return toBillionaireSnapshotDTOList(rows);
  }

  async getDailySummaries(input: unknown) {
    const parsed = listBillionaireDailySummariesSchema.parse(input);
    const options: FindBillionaireSummariesOptions = {
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      limit: parsed.limit,
      offset: parsed.offset,
    };
    const rows = await this.summaryRepo.findAll(options);
    return toBillionaireDailySummaryDTOList(rows);
  }

  async getLatestSummary() {
    const rows = await this.summaryRepo.findLatest(1);
    return rows[0] ? toBillionaireDailySummaryDTO(rows[0]) : null;
  }

  async getSnapshotCount(figureId?: string) {
    return this.snapshotRepo.count(figureId);
  }

  async getSummaryCount() {
    return this.summaryRepo.count();
  }
}
