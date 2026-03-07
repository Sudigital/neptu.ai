import type { BillionaireDailySummary } from "../schemas/billionaire-daily-summaries";

export interface BillionaireDailySummaryDTO {
  id: number;
  summaryDate: string;
  billionaireCount: number;
  totalNetWorthBillions: number;
  totalDailyChangeBillions: number | null;
  avgNetWorthBillions: number | null;
  avgProsperityScore: number | null;
  avgDailyEnergyScore: number | null;
  avgUripPeluangScore: number | null;
  avgCompatibilityScore: number | null;
  neptuSentimentScore: number | null;
  topGainerId: string | null;
  topGainerChange: number | null;
  topLoserId: string | null;
  topLoserChange: number | null;
  createdAt: string;
}

export function toBillionaireDailySummaryDTO(
  summary: BillionaireDailySummary
): BillionaireDailySummaryDTO {
  return {
    id: summary.id,
    summaryDate: summary.summaryDate,
    billionaireCount: summary.billionaireCount,
    totalNetWorthBillions: summary.totalNetWorthBillions,
    totalDailyChangeBillions: summary.totalDailyChangeBillions,
    avgNetWorthBillions: summary.avgNetWorthBillions,
    avgProsperityScore: summary.avgProsperityScore,
    avgDailyEnergyScore: summary.avgDailyEnergyScore,
    avgUripPeluangScore: summary.avgUripPeluangScore,
    avgCompatibilityScore: summary.avgCompatibilityScore,
    neptuSentimentScore: summary.neptuSentimentScore,
    topGainerId: summary.topGainerId,
    topGainerChange: summary.topGainerChange,
    topLoserId: summary.topLoserId,
    topLoserChange: summary.topLoserChange,
    createdAt: summary.createdAt.toISOString(),
  };
}

export function toBillionaireDailySummaryDTOList(
  summaries: BillionaireDailySummary[]
): BillionaireDailySummaryDTO[] {
  return summaries.map(toBillionaireDailySummaryDTO);
}
