import type { PersonDTO } from "@neptu/drizzle-orm";
import type { CompatibilityCategory, PersonTag } from "@neptu/shared";

import {
  getProsperity,
  getProsperityPeriods,
  PROSPERITY_LEVELS,
} from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";

/* ── Constants ───────────────────────────────────────── */

export const WORKER_BASE_URL =
  import.meta.env.VITE_WORKER_URL || "http://localhost:8787";
export const PP_REFETCH_INTERVAL = 120_000;
export const PP_STALE_TIME = 1_800_000;
export const MAX_PERSONS = 500;

export const PERSON_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#a855f7",
] as const;

export const LEVEL_COLORS: Record<number, string> = {
  0: "#ef4444",
  1: "#f97316",
  2: "#eab308",
  3: "#84cc16",
  4: "#22c55e",
  5: "#10b981",
  7: "#3b82f6",
  8: "#8b5cf6",
};

const MAX_PROSPERITY_LEVEL = 8;
const WEIGHT_QUARTER = 0.25;
const WEIGHT_THIRD = 1 / 3;
const WEIGHT_HALF = 0.5;
const FULL_SCORE = 100;
const MAX_URIP = 18;

export const SENTIMENT_ZONES = [
  { min: 0, max: 24, label: "Extreme Fear", color: "#ef4444" },
  { min: 25, max: 44, label: "Fear", color: "#f97316" },
  { min: 45, max: 55, label: "Neutral", color: "#eab308" },
  { min: 56, max: 75, label: "Greed", color: "#84cc16" },
  { min: 76, max: 100, label: "Extreme Greed", color: "#22c55e" },
] as const;

export type SentimentZone = (typeof SENTIMENT_ZONES)[number];

export const CATEGORY_STYLES: Record<
  CompatibilityCategory,
  { bg: string; text: string }
> = {
  mitra: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  neutral: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  satru: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
};

/* ── Types ───────────────────────────────────────────── */

export interface ChartPoint {
  date: string;
  fullDate: string;
  timestamp: number;
  price: number;
}

export interface CoinGeckoChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CryptoMarketCoin {
  symbol: string;
  name: string;
  currentPrice: number | null;
  marketCap: number | null;
  priceChangePercentage24h: number | null;
  totalVolume: number | null;
  image: string | null;
}

export interface CryptoMarketResponse {
  success: boolean;
  data: CryptoMarketCoin[];
  count: number;
}

/* ── Helpers ─────────────────────────────────────────── */

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
}

const TRILLION = 1_000_000_000_000;
const BILLION = 1_000_000_000;
const MILLION = 1_000_000;
const PRICE_THRESHOLD_HIGH = 1000;
const PRICE_THRESHOLD_MED = 1;
const PRICE_THRESHOLD_LOW = 0.01;

export function formatCompactCurrency(value: number): string {
  if (value >= TRILLION) return `$${(value / TRILLION).toFixed(2)}T`;
  if (value >= BILLION) return `$${(value / BILLION).toFixed(2)}B`;
  if (value >= MILLION) return `$${(value / MILLION).toFixed(1)}M`;
  return formatCurrency(value);
}

export function formatCoinPrice(value: number): string {
  if (value >= PRICE_THRESHOLD_HIGH)
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= PRICE_THRESHOLD_MED) return `$${value.toFixed(2)}`;
  if (value >= PRICE_THRESHOLD_LOW) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

export function calculateAge(birthday: string): number | null {
  const birth = new Date(birthday);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getTotalUrip(figure: PersonDTO): number | null {
  const wuku = figure.wukuData as Record<string, unknown> | null;
  if (!wuku) return null;
  const potensi = wuku.potensi as Record<string, unknown> | undefined;
  if (potensi?.total_urip !== undefined) {
    return Number(potensi.total_urip);
  }
  if (wuku.total_urip !== undefined) return Number(wuku.total_urip);
  return null;
}

type ProsperityResult = {
  level: number;
  descriptions: (typeof PROSPERITY_LEVELS)[keyof typeof PROSPERITY_LEVELS];
};

/**
 * Get prosperity for age — falls back to the highest-age period
 * when the person is older than the table covers.
 */
export function getProsperityWithFallback(
  totalUrip: number,
  age: number
): ProsperityResult | null {
  const direct = getProsperity(totalUrip, age);
  if (direct) return direct;

  const periods = getProsperityPeriods(totalUrip);
  if (!periods || periods.length === 0) return null;

  const last = periods[periods.length - 1];
  if (age > last.toAge) {
    const desc =
      PROSPERITY_LEVELS[last.level as keyof typeof PROSPERITY_LEVELS] ?? null;
    if (!desc) return null;
    return { level: last.level, descriptions: desc };
  }

  return null;
}

export function formatPricePoints(raw: CoinGeckoChartResponse): ChartPoint[] {
  if (!raw.prices?.length) return [];
  return raw.prices.map(([ts, price]) => {
    const d = new Date(ts);
    return {
      date: formatShortDate(d),
      fullDate: formatFullDate(d),
      timestamp: ts,
      price,
    };
  });
}

/* ── Market Sentiment ────────────────────────────────── */

export interface MarketSentiment {
  score: number;
  zone: SentimentZone;
  avgCompatibility: number;
  avgProsperity: number;
  avgDailyEnergy: number;
  avgUripPeluang: number;
  pairCount: number;
  figureCount: number;
}

export interface FigureRow {
  id: string;
  name: string;
  birthday: string;
  age: number | null;
  profesi: string;
  figureCategory: string;
  allCategories: string[];
  tags: PersonTag[];
  category: CompatibilityCategory | null;
  popularity: number | null;
  uripPotensi: number | null;
  uripPeluang: number | null;
  dailyEnergy: number;
  sentimentIndex: number;
}

let _calc: NeptuCalculator | null = null;
function getCalc(): NeptuCalculator {
  if (!_calc) _calc = new NeptuCalculator();
  return _calc;
}

export function computeMarketSentiment(
  figures: PersonDTO[]
): MarketSentiment | null {
  if (figures.length === 0) return null;

  const prosperityScores: number[] = [];
  for (const f of figures) {
    const totalUrip = getTotalUrip(f);
    const age = calculateAge(f.birthday);
    if (totalUrip !== null && age !== null) {
      const current = getProsperityWithFallback(totalUrip, age);
      if (current) {
        prosperityScores.push(
          (current.level / MAX_PROSPERITY_LEVEL) * FULL_SCORE
        );
      }
    }
  }

  const calc = getCalc();
  const compatScores: number[] = [];
  for (let i = 0; i < figures.length; i++) {
    for (let j = i + 1; j < figures.length; j++) {
      try {
        const result = calc.calculateCompatibility(
          new Date(figures[i].birthday),
          new Date(figures[j].birthday)
        );
        compatScores.push(result.scores.overall);
      } catch {
        /* skip invalid pairs */
      }
    }
  }

  /* Birthday vs today — how each person's energy aligns with today */
  const dailyEnergyScores: number[] = [];
  const peluangUripScores: number[] = [];
  const today = new Date();
  for (const f of figures) {
    try {
      const result = calc.calculateCompatibility(new Date(f.birthday), today);
      dailyEnergyScores.push(result.scores.overall);
    } catch {
      /* skip invalid */
    }
    try {
      const peluang = calc.calculatePeluang(today, new Date(f.birthday));
      peluangUripScores.push((peluang.total_urip / MAX_URIP) * FULL_SCORE);
    } catch {
      /* skip */
    }
  }

  const avgProsperity =
    prosperityScores.length > 0
      ? prosperityScores.reduce((a, b) => a + b, 0) / prosperityScores.length
      : 0;

  const avgCompatibility =
    compatScores.length > 0
      ? compatScores.reduce((a, b) => a + b, 0) / compatScores.length
      : 0;

  const avgDailyEnergy =
    dailyEnergyScores.length > 0
      ? dailyEnergyScores.reduce((a, b) => a + b, 0) / dailyEnergyScores.length
      : 0;

  const avgUripPeluang =
    peluangUripScores.length > 0
      ? peluangUripScores.reduce((a, b) => a + b, 0) / peluangUripScores.length
      : 0;

  /* Weighted score: 4-way when all factors exist */
  let score: number;
  const hasPairs = compatScores.length > 0;
  const hasDailyEnergy = dailyEnergyScores.length > 0;
  const hasPeluang = peluangUripScores.length > 0;

  if (hasPairs && hasDailyEnergy && hasPeluang) {
    score = Math.round(
      avgProsperity * WEIGHT_QUARTER +
        avgCompatibility * WEIGHT_QUARTER +
        avgDailyEnergy * WEIGHT_QUARTER +
        avgUripPeluang * WEIGHT_QUARTER
    );
  } else if (hasDailyEnergy && hasPeluang) {
    score = Math.round(
      avgProsperity * WEIGHT_THIRD +
        avgDailyEnergy * WEIGHT_THIRD +
        avgUripPeluang * WEIGHT_THIRD
    );
  } else if (hasDailyEnergy) {
    score = Math.round(
      avgProsperity * WEIGHT_HALF + avgDailyEnergy * WEIGHT_HALF
    );
  } else {
    score = Math.round(avgProsperity);
  }

  const zone =
    SENTIMENT_ZONES.find((z) => score >= z.min && score <= z.max) ??
    SENTIMENT_ZONES[2];

  return {
    score,
    zone,
    avgCompatibility: Math.round(avgCompatibility),
    avgProsperity: Math.round(avgProsperity),
    avgDailyEnergy: Math.round(avgDailyEnergy),
    avgUripPeluang: Math.round(avgUripPeluang),
    pairCount: compatScores.length,
    figureCount: figures.length,
  };
}

/* ── Figure Rows for Table ───────────────────────────── */

export function computeFigureRows(figures: PersonDTO[]): FigureRow[] {
  const calc = getCalc();
  const today = new Date();

  return figures.map((f) => {
    const totalUrip = getTotalUrip(f);
    const age = calculateAge(f.birthday);
    const birthDate = new Date(f.birthday);

    /* Prosperity for sentiment calc */
    let prosperityLevel: number | null = null;
    if (totalUrip !== null && age !== null) {
      const sp = getProsperityWithFallback(totalUrip, age);
      if (sp) prosperityLevel = sp.level;
    }

    /* Potensi urip */
    let uripPotensi: number | null = null;
    try {
      const potensi = calc.calculatePotensi(birthDate);
      uripPotensi = potensi.total_urip;
    } catch {
      /* skip */
    }

    /* Peluang urip (today relative to birthday) */
    let uripPeluang: number | null = null;
    try {
      const peluang = calc.calculatePeluang(today, birthDate);
      uripPeluang = peluang.total_urip;
    } catch {
      /* skip */
    }

    /* Daily energy (birthday vs today compatibility) */
    let dailyEnergy = 0;
    let category: CompatibilityCategory | null = null;
    try {
      const result = calc.calculateCompatibility(birthDate, today);
      dailyEnergy = result.scores.overall;
      category = result.pairing.category;
    } catch {
      /* skip */
    }

    /* Per-person sentiment index: prosperity + daily energy + peluang urip */
    const pScore =
      prosperityLevel !== null
        ? (prosperityLevel / MAX_PROSPERITY_LEVEL) * FULL_SCORE
        : 0;
    const peluangScore =
      uripPeluang !== null ? (uripPeluang / MAX_URIP) * FULL_SCORE : 0;
    const sentimentIndex =
      uripPeluang !== null
        ? Math.round(
            pScore * WEIGHT_THIRD +
              dailyEnergy * WEIGHT_THIRD +
              peluangScore * WEIGHT_THIRD
          )
        : Math.round(pScore * WEIGHT_HALF + dailyEnergy * WEIGHT_HALF);

    return {
      id: f.id,
      name: f.name,
      birthday: f.birthday,
      age,
      profesi: f.title ?? "—",
      figureCategory: f.categories[0] ?? "world_leader",
      allCategories: f.categories,
      tags: (f.tags ?? []) as PersonTag[],
      category,
      popularity: f.popularity ?? null,
      uripPotensi,
      uripPeluang,
      dailyEnergy: Math.round(dailyEnergy),
      sentimentIndex,
    };
  });
}

/* ── Fibonacci Retracement Levels ────────────────────── */

const FIBONACCI_RATIOS = [
  { ratio: 0, label: "0%" },
  { ratio: 0.236, label: "23.6%" },
  { ratio: 0.382, label: "38.2%" },
  { ratio: 0.5, label: "50%" },
  { ratio: 0.618, label: "61.8%" },
  { ratio: 0.786, label: "78.6%" },
  { ratio: 1, label: "100%" },
] as const;

export interface FibonacciLevel {
  price: number;
  label: string;
  ratio: number;
}

export function computeFibonacciLevels(
  chartData: ChartPoint[]
): FibonacciLevel[] {
  if (chartData.length < 2) return [];

  const prices = chartData.map((p) => p.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const diff = high - low;

  if (diff === 0) return [];

  return FIBONACCI_RATIOS.map(({ ratio, label }) => ({
    price: high - diff * ratio,
    label,
    ratio,
  }));
}
