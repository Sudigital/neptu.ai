// ============================================================================
// Prosperity — Prosperity in Six-Year Cycles
// ============================================================================

/**
 * Prosperity level descriptions keyed by numeric code.
 * Source: Traditional Balinese Primbon Wariga reference tables.
 * Each level has translations for all supported languages.
 */
export const PROSPERITY_LEVELS = {
  0: {
    en: "Poor, health condition",
    id: "Kesakitan (penderitaan)",
    fr: "Pauvre, problèmes de santé",
    de: "Arm, gesundheitliche Probleme",
    es: "Pobre, problemas de salud",
    pt: "Pobre, problemas de saúde",
    ru: "Бедность, проблемы со здоровьем",
    ja: "貧困、健康問題",
    ko: "빈곤, 건강 문제",
    zh: "贫困，健康问题",
  },
  1: {
    en: "Minimum income",
    id: "Penghasilan sedikit",
    fr: "Revenu minimum",
    de: "Minimaleinkommen",
    es: "Ingreso mínimo",
    pt: "Renda mínima",
    ru: "Минимальный доход",
    ja: "最低収入",
    ko: "최소 수입",
    zh: "最低收入",
  },
  2: {
    en: "Medium income",
    id: "Di tengah (penghasilan sedang)",
    fr: "Revenu moyen",
    de: "Mittleres Einkommen",
    es: "Ingreso medio",
    pt: "Renda média",
    ru: "Средний доход",
    ja: "中程度の収入",
    ko: "중간 수입",
    zh: "中等收入",
  },
  3: {
    en: "Good income",
    id: "Baik (penghasilan baik)",
    fr: "Bon revenu",
    de: "Gutes Einkommen",
    es: "Buen ingreso",
    pt: "Boa renda",
    ru: "Хороший доход",
    ja: "良い収入",
    ko: "좋은 수입",
    zh: "良好收入",
  },
  4: {
    en: "Very good income",
    id: "Baik sekali (penghasilan baik sekali)",
    fr: "Très bon revenu",
    de: "Sehr gutes Einkommen",
    es: "Muy buen ingreso",
    pt: "Renda muito boa",
    ru: "Очень хороший доход",
    ja: "非常に良い収入",
    ko: "매우 좋은 수입",
    zh: "非常好的收入",
  },
  5: {
    en: "Happy life, good income",
    id: "Hidup senang (penghasilan baik)",
    fr: "Vie heureuse, bon revenu",
    de: "Glückliches Leben, gutes Einkommen",
    es: "Vida feliz, buen ingreso",
    pt: "Vida feliz, boa renda",
    ru: "Счастливая жизнь, хороший доход",
    ja: "幸せな生活、良い収入",
    ko: "행복한 삶, 좋은 수입",
    zh: "幸福生活，良好收入",
  },
  7: {
    en: "Luxurious life",
    id: "Paripurna (hidup mewah)",
    fr: "Vie luxueuse",
    de: "Luxuriöses Leben",
    es: "Vida lujosa",
    pt: "Vida luxuosa",
    ru: "Роскошная жизнь",
    ja: "豪華な生活",
    ko: "호화로운 삶",
    zh: "奢华生活",
  },
  8: {
    en: "Luxurious life, everything achieved",
    id: "Hidup mewah, semua yang diinginkan berhasil dan tercapai",
    fr: "Vie luxueuse, tous les souhaits réalisés",
    de: "Luxuriöses Leben, alles erreicht",
    es: "Vida lujosa, todo logrado",
    pt: "Vida luxuosa, tudo alcançado",
    ru: "Роскошная жизнь, всё достигнуто",
    ja: "豪華な生活、すべて達成",
    ko: "호화로운 삶, 모든 것 달성",
    zh: "奢华生活，一切如愿",
  },
} as const;

export type ProsperityLevel = keyof typeof PROSPERITY_LEVELS;

/**
 * Age range boundary for a single prosperity period.
 */
interface ProsperityPeriod {
  readonly fromAge: number;
  readonly toAge: number;
  readonly level: number;
}

/**
 * Prosperity lookup table per total_urip value (7–18).
 * Each entry contains an array of 6-year age-range periods with
 * a prosperity level code.
 */
export const PROSPERITY_TABLE: Readonly<
  Record<number, readonly ProsperityPeriod[]>
> = {
  7: [
    { fromAge: 0, toAge: 6, level: 4 },
    { fromAge: 7, toAge: 12, level: 1 },
    { fromAge: 13, toAge: 18, level: 4 },
    { fromAge: 19, toAge: 24, level: 1 },
    { fromAge: 25, toAge: 30, level: 0 },
    { fromAge: 31, toAge: 36, level: 2 },
    { fromAge: 37, toAge: 42, level: 2 },
  ],
  8: [
    { fromAge: 0, toAge: 6, level: 4 },
    { fromAge: 7, toAge: 12, level: 1 },
    { fromAge: 13, toAge: 18, level: 0 },
    { fromAge: 19, toAge: 24, level: 1 },
    { fromAge: 25, toAge: 30, level: 0 },
    { fromAge: 31, toAge: 36, level: 3 },
    { fromAge: 37, toAge: 42, level: 0 },
    { fromAge: 43, toAge: 48, level: 7 },
  ],
  9: [
    { fromAge: 0, toAge: 6, level: 2 },
    { fromAge: 7, toAge: 12, level: 5 },
    { fromAge: 13, toAge: 18, level: 1 },
    { fromAge: 19, toAge: 24, level: 0 },
    { fromAge: 25, toAge: 30, level: 4 },
    { fromAge: 31, toAge: 36, level: 1 },
    { fromAge: 37, toAge: 42, level: 4 },
    { fromAge: 43, toAge: 48, level: 0 },
    { fromAge: 49, toAge: 54, level: 1 },
  ],
  10: [
    { fromAge: 0, toAge: 6, level: 1 },
    { fromAge: 7, toAge: 12, level: 0 },
    { fromAge: 13, toAge: 18, level: 4 },
    { fromAge: 19, toAge: 24, level: 1 },
    { fromAge: 25, toAge: 30, level: 1 },
    { fromAge: 31, toAge: 36, level: 3 },
    { fromAge: 37, toAge: 42, level: 0 },
    { fromAge: 43, toAge: 48, level: 0 },
    { fromAge: 49, toAge: 54, level: 4 },
    { fromAge: 55, toAge: 60, level: 4 },
  ],
  11: [
    { fromAge: 0, toAge: 6, level: 2 },
    { fromAge: 7, toAge: 12, level: 4 },
    { fromAge: 13, toAge: 18, level: 1 },
    { fromAge: 19, toAge: 24, level: 1 },
    { fromAge: 25, toAge: 30, level: 8 },
    { fromAge: 31, toAge: 36, level: 1 },
    { fromAge: 37, toAge: 42, level: 0 },
    { fromAge: 43, toAge: 48, level: 1 },
    { fromAge: 49, toAge: 54, level: 2 },
    { fromAge: 55, toAge: 60, level: 0 },
    { fromAge: 61, toAge: 66, level: 2 },
  ],
  12: [
    { fromAge: 0, toAge: 6, level: 0 },
    { fromAge: 7, toAge: 12, level: 5 },
    { fromAge: 13, toAge: 18, level: 1 },
    { fromAge: 19, toAge: 24, level: 0 },
    { fromAge: 25, toAge: 30, level: 4 },
    { fromAge: 31, toAge: 36, level: 0 },
    { fromAge: 37, toAge: 42, level: 1 },
    { fromAge: 43, toAge: 48, level: 0 },
    { fromAge: 49, toAge: 54, level: 1 },
    { fromAge: 55, toAge: 60, level: 4 },
    { fromAge: 61, toAge: 66, level: 4 },
    { fromAge: 67, toAge: 72, level: 0 },
  ],
  13: [
    { fromAge: 0, toAge: 6, level: 3 },
    { fromAge: 7, toAge: 12, level: 1 },
    { fromAge: 13, toAge: 18, level: 0 },
    { fromAge: 19, toAge: 24, level: 5 },
    { fromAge: 25, toAge: 30, level: 0 },
    { fromAge: 31, toAge: 36, level: 1 },
    { fromAge: 37, toAge: 42, level: 1 },
    { fromAge: 43, toAge: 48, level: 5 },
    { fromAge: 49, toAge: 54, level: 2 },
    { fromAge: 55, toAge: 60, level: 0 },
    { fromAge: 61, toAge: 66, level: 1 },
    { fromAge: 67, toAge: 72, level: 2 },
    { fromAge: 73, toAge: 78, level: 5 },
  ],
  14: [
    { fromAge: 0, toAge: 6, level: 1 },
    { fromAge: 7, toAge: 12, level: 0 },
    { fromAge: 13, toAge: 18, level: 1 },
    { fromAge: 19, toAge: 24, level: 4 },
    { fromAge: 25, toAge: 30, level: 0 },
    { fromAge: 31, toAge: 36, level: 0 },
    { fromAge: 37, toAge: 42, level: 4 },
    { fromAge: 43, toAge: 48, level: 4 },
    { fromAge: 49, toAge: 54, level: 1 },
    { fromAge: 55, toAge: 60, level: 4 },
    { fromAge: 61, toAge: 66, level: 0 },
    { fromAge: 67, toAge: 72, level: 1 },
    { fromAge: 73, toAge: 78, level: 4 },
    { fromAge: 79, toAge: 84, level: 4 },
  ],
  15: [
    { fromAge: 0, toAge: 6, level: 2 },
    { fromAge: 7, toAge: 12, level: 0 },
    { fromAge: 13, toAge: 18, level: 1 },
    { fromAge: 19, toAge: 24, level: 1 },
    { fromAge: 25, toAge: 30, level: 5 },
    { fromAge: 31, toAge: 36, level: 2 },
    { fromAge: 37, toAge: 42, level: 0 },
    { fromAge: 43, toAge: 48, level: 1 },
    { fromAge: 49, toAge: 54, level: 2 },
    { fromAge: 55, toAge: 60, level: 5 },
    { fromAge: 61, toAge: 66, level: 5 },
    { fromAge: 67, toAge: 72, level: 1 },
    { fromAge: 73, toAge: 78, level: 0 },
    { fromAge: 79, toAge: 84, level: 4 },
    { fromAge: 85, toAge: 90, level: 1 },
  ],
  16: [
    { fromAge: 0, toAge: 6, level: 0 },
    { fromAge: 7, toAge: 12, level: 3 },
    { fromAge: 13, toAge: 18, level: 1 },
    { fromAge: 19, toAge: 24, level: 2 },
    { fromAge: 25, toAge: 30, level: 0 },
    { fromAge: 31, toAge: 36, level: 1 },
    { fromAge: 37, toAge: 42, level: 8 },
    { fromAge: 43, toAge: 48, level: 1 },
    { fromAge: 49, toAge: 54, level: 2 },
    { fromAge: 55, toAge: 60, level: 7 },
    { fromAge: 61, toAge: 66, level: 2 },
    { fromAge: 67, toAge: 72, level: 0 },
    { fromAge: 73, toAge: 78, level: 7 },
    { fromAge: 79, toAge: 84, level: 1 },
    { fromAge: 85, toAge: 90, level: 0 },
    { fromAge: 91, toAge: 96, level: 2 },
  ],
  17: [
    { fromAge: 0, toAge: 6, level: 1 },
    { fromAge: 7, toAge: 12, level: 1 },
    { fromAge: 13, toAge: 18, level: 0 },
    { fromAge: 19, toAge: 24, level: 5 },
    { fromAge: 25, toAge: 30, level: 0 },
    { fromAge: 31, toAge: 36, level: 1 },
    { fromAge: 37, toAge: 42, level: 1 },
    { fromAge: 43, toAge: 48, level: 5 },
    { fromAge: 49, toAge: 54, level: 2 },
    { fromAge: 55, toAge: 60, level: 0 },
    { fromAge: 61, toAge: 66, level: 1 },
    { fromAge: 67, toAge: 72, level: 2 },
    { fromAge: 73, toAge: 78, level: 5 },
    { fromAge: 79, toAge: 84, level: 5 },
    { fromAge: 85, toAge: 90, level: 1 },
    { fromAge: 91, toAge: 96, level: 0 },
    { fromAge: 97, toAge: 102, level: 4 },
  ],
  18: [
    { fromAge: 0, toAge: 6, level: 2 },
    { fromAge: 7, toAge: 12, level: 5 },
    { fromAge: 13, toAge: 18, level: 1 },
    { fromAge: 19, toAge: 24, level: 0 },
    { fromAge: 25, toAge: 30, level: 4 },
    { fromAge: 31, toAge: 36, level: 1 },
    { fromAge: 37, toAge: 42, level: 4 },
    { fromAge: 43, toAge: 48, level: 0 },
    { fromAge: 49, toAge: 54, level: 1 },
    { fromAge: 55, toAge: 60, level: 4 },
    { fromAge: 61, toAge: 66, level: 4 },
    { fromAge: 67, toAge: 72, level: 0 },
    { fromAge: 73, toAge: 78, level: 0 },
    { fromAge: 79, toAge: 84, level: 4 },
    { fromAge: 85, toAge: 90, level: 1 },
    { fromAge: 91, toAge: 96, level: 4 },
    { fromAge: 97, toAge: 102, level: 0 },
    { fromAge: 103, toAge: 108, level: 1 },
  ],
} as const;

/**
 * Look up the Prosperity prosperity level for a given total_urip and age.
 * Returns the level code and all language descriptions, or null if out of range.
 */
export function getProsperity(
  totalUrip: number,
  age: number
): {
  level: number;
  descriptions: (typeof PROSPERITY_LEVELS)[ProsperityLevel];
} | null {
  const periods = PROSPERITY_TABLE[totalUrip];
  if (!periods) return null;

  const period = periods.find((p) => age >= p.fromAge && age <= p.toAge);
  if (!period) return null;

  const desc = PROSPERITY_LEVELS[period.level as ProsperityLevel] ?? null;
  if (!desc) return null;

  return { level: period.level, descriptions: desc };
}

/**
 * Get all prosperity periods for a given total_urip (for display/AI context).
 */
export function getProsperityPeriods(
  totalUrip: number
): readonly ProsperityPeriod[] | null {
  return PROSPERITY_TABLE[totalUrip] ?? null;
}
