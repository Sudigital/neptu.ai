import { z } from "zod";

const MAX_SCORE = 100;
const MIN_SCORE = 0;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 365;
const DEFAULT_OFFSET = 0;

const scoreField = z
  .number()
  .min(MIN_SCORE)
  .max(MAX_SCORE)
  .nullable()
  .optional();

export const createBillionaireSnapshotSchema = z.object({
  figureId: z.string().min(1),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  forbesRank: z.number().int().positive().nullable().optional(),
  netWorthBillions: z.number(),
  dailyChangeBillions: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  wealthSource: z.string().nullable().optional(),
  prosperityScore: scoreField,
  dailyEnergyScore: scoreField,
  uripPeluangScore: scoreField,
  compatibilityScore: scoreField,
  neptuAlphaScore: scoreField,
});

export const listBillionaireSnapshotsSchema = z.object({
  figureId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
  offset: z.number().int().min(0).default(DEFAULT_OFFSET),
});

export const createBillionaireDailySummarySchema = z.object({
  summaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billionaireCount: z.number().int().positive(),
  totalNetWorthBillions: z.number(),
  totalDailyChangeBillions: z.number().nullable().optional(),
  avgNetWorthBillions: z.number().nullable().optional(),
  avgProsperityScore: scoreField,
  avgDailyEnergyScore: scoreField,
  avgUripPeluangScore: scoreField,
  avgCompatibilityScore: scoreField,
  neptuSentimentScore: scoreField,
  topGainerId: z.string().nullable().optional(),
  topGainerChange: z.number().nullable().optional(),
  topLoserId: z.string().nullable().optional(),
  topLoserChange: z.number().nullable().optional(),
});

export const listBillionaireDailySummariesSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
  offset: z.number().int().min(0).default(DEFAULT_OFFSET),
});

export type CreateBillionaireSnapshotInput = z.infer<
  typeof createBillionaireSnapshotSchema
>;
export type ListBillionaireSnapshotsInput = z.infer<
  typeof listBillionaireSnapshotsSchema
>;
export type CreateBillionaireDailySummaryInput = z.infer<
  typeof createBillionaireDailySummarySchema
>;
export type ListBillionaireDailySummariesInput = z.infer<
  typeof listBillionaireDailySummariesSchema
>;
