import type { BillionaireSnapshot } from "../schemas/billionaire-snapshots";
import type { ForbesFinancialAsset } from "../schemas/billionaire-snapshots";

export interface BillionaireSnapshotDTO {
  id: number;
  figureId: string;
  snapshotDate: string;
  forbesRank: number | null;
  netWorthBillions: number;
  dailyChangeBillions: number | null;
  privateAssetsWorth: number | null;
  country: string | null;
  industry: string | null;
  wealthSource: string | null;
  financialAssets: ForbesFinancialAsset[] | null;
  prosperityScore: number | null;
  dailyEnergyScore: number | null;
  uripPeluangScore: number | null;
  compatibilityScore: number | null;
  neptuAlphaScore: number | null;
  createdAt: string;
}

export function toBillionaireSnapshotDTO(
  snapshot: BillionaireSnapshot
): BillionaireSnapshotDTO {
  return {
    id: snapshot.id,
    figureId: snapshot.figureId,
    snapshotDate: snapshot.snapshotDate,
    forbesRank: snapshot.forbesRank,
    netWorthBillions: snapshot.netWorthBillions,
    dailyChangeBillions: snapshot.dailyChangeBillions,
    privateAssetsWorth: snapshot.privateAssetsWorth,
    country: snapshot.country,
    industry: snapshot.industry,
    wealthSource: snapshot.wealthSource,
    financialAssets: snapshot.financialAssets,
    prosperityScore: snapshot.prosperityScore,
    dailyEnergyScore: snapshot.dailyEnergyScore,
    uripPeluangScore: snapshot.uripPeluangScore,
    compatibilityScore: snapshot.compatibilityScore,
    neptuAlphaScore: snapshot.neptuAlphaScore,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

export function toBillionaireSnapshotDTOList(
  snapshots: BillionaireSnapshot[]
): BillionaireSnapshotDTO[] {
  return snapshots.map(toBillionaireSnapshotDTO);
}
