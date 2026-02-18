import type { Frekuensi, Potensi } from "./wuku";

// ============================================================================
// Compatibility Types (Mitra Satru)
// ============================================================================

export type MitraSatruCategory = "mitra" | "neutral" | "satru";

export interface DimensionComparison {
  dimension: string;
  person1Value: string;
  person2Value: string;
  isMatch: boolean;
}

export interface CompatibilityResult {
  person1: Potensi;
  person2: Potensi;
  mitraSatru: {
    person1Frekuensi: Frekuensi;
    person2Frekuensi: Frekuensi;
    combinedFrekuensi: Frekuensi;
    category: MitraSatruCategory;
    description: string;
  };
  dimensions: DimensionComparison[];
  scores: {
    frekuensi: number;
    cycles: number;
    traits: number;
    overall: number;
  };
}

export interface CompatibilityPair {
  personA: number;
  personB: number;
  result: CompatibilityResult;
}

export const MIN_COMPATIBILITY_PEOPLE = 2 as const;
export const MAX_COMPATIBILITY_PEOPLE = 5 as const;
