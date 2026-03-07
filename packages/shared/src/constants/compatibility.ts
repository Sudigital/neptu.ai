import type { CompatibilityCategory } from "../types/compatibility";

// ============================================================================
// Compatibility Constants
// ============================================================================

export const COMPATIBILITY_FREKUENSI = {
  RATU: 0,
  LARA: 1,
  PATI: 2,
  GURU: 3,
} as const;

export const COMPATIBILITY_DESCRIPTIONS: Record<string, string> = {
  GURU: "Tertuntun (Guided) — Most auspicious, learning and growth",
  RATU: "Dikuasai (Governed) — Structured, order and stability",
  LARA: "Terhalang (Obstructed) — Challenges that build resilience",
  PATI: "Batal (Voided) — Release, letting go, transformation",
} as const;

export const COMPATIBILITY_PAIRS: Record<
  string,
  Record<string, CompatibilityCategory>
> = {
  GURU: { GURU: "mitra", RATU: "mitra", LARA: "neutral", PATI: "satru" },
  RATU: { GURU: "mitra", RATU: "neutral", LARA: "satru", PATI: "neutral" },
  LARA: { GURU: "neutral", RATU: "satru", LARA: "neutral", PATI: "mitra" },
  PATI: { GURU: "satru", RATU: "neutral", LARA: "mitra", PATI: "satru" },
} as const;

export const COMPATIBILITY_SCORES = {
  FREKUENSI_WEIGHT: 40,
  CYCLES_WEIGHT: 30,
  TRAITS_WEIGHT: 30,
  MITRA_SCORE: 100,
  NEUTRAL_SCORE: 60,
  SATRU_SCORE: 20,
  MATCH_BONUS: 100,
  NO_MATCH: 0,
} as const;

export const ALIGNMENT_THRESHOLDS = {
  MAX_SCORE: 100,
  URIP_DIVISOR: 30,
  BULLISH: 70,
  BEARISH: 40,
  WUKU_MATCH_SCORE: 30,
  PANCA_MATCH_SCORE: 25,
  SAPTA_MATCH_SCORE: 25,
  DAY_ALIGNMENT_MOD: 20,
} as const;
