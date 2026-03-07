import type { PersonDTO } from "@neptu/drizzle-orm";
import type {
  InvestmentSignal,
  MarketSentiment,
  MarketAsset,
} from "@neptu/shared";

import {
  getProsperity,
  getProsperityPeriods,
  INVESTMENT_THRESHOLDS,
  PROSPERITY_LEVELS,
  SENTIMENT_CONFIG,
  TOP_CRYPTO_COINS,
  TOPIC_TO_CRYPTO_MAP,
} from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";

/* ── Constants ───────────────────────────────────────── */

export const WORKER_BASE =
  import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

export const MARKET_REFETCH_INTERVAL = 120_000;
export const MARKET_STALE_TIME = 300_000;

const MAX_PROSPERITY_LEVEL = 8;
const FULL_SCORE = 100;
const MAX_URIP = 18;
const DAYS_PER_YEAR = 365.25;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = DAYS_PER_YEAR * MS_PER_DAY;
const SENTIMENT_BONUS_FACTOR = 15;
const MOMENTUM_CAP = 20;
const MOMENTUM_MULTIPLIER = 2;
const MOMENTUM_WEIGHT = 0.1;
const ENERGY_WEIGHT = 0.3;
const PROSPERITY_WEIGHT = 0.3;
const BASE_SCORE = 50;
const HEADLINE_MATCH_SCORE = 30;
const INDUSTRY_MATCH_SCORE = 20;
const PERSON_SCORE_WEIGHT = 0.5;
const DAILY_URIP_WEIGHT = 0.4;
const PERSON_PROSPERITY_WEIGHT = 0.6;
const MAX_RELATED_PERSONS = 5;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/* ── Category Matching Helper ────────────────────────── */

function getCategoryMatch(topicLower: string, person: PersonDTO): boolean {
  if (topicLower === "ai") {
    return person.categories.includes("tech_leader");
  }
  if (topicLower === "defi" || topicLower === "ethereum") {
    return (
      person.industries?.some(
        (ind) =>
          ind.toLowerCase().includes("crypto") ||
          ind.toLowerCase().includes("blockchain")
      ) ?? false
    );
  }
  return false;
}

/* ── Calculator singleton ────────────────────────────── */

let _calc: NeptuCalculator | null = null;
function getCalc(): NeptuCalculator {
  if (!_calc) _calc = new NeptuCalculator();
  return _calc;
}

/* ── Neptu Analysis for a Topic ──────────────────────── */

export interface TopicNeptuAnalysis {
  cosmicAlignmentScore: number;
  prosperityLevel: number;
  prosperityLabel: string;
  dailyEnergyScore: number;
  investmentSignal: InvestmentSignal;
  investmentLabel: string;
  investmentColor: string;
  overallScore: number;
  relatedCoin: string | null;
  coinBirthday: string | null;
}

function getInvestmentSignal(score: number): {
  signal: InvestmentSignal;
  label: string;
  color: string;
} {
  if (score >= INVESTMENT_THRESHOLDS.STRONG_BUY) {
    return { signal: "strong_buy", label: "Strong Buy", color: "#22c55e" };
  }
  if (score >= INVESTMENT_THRESHOLDS.BUY) {
    return { signal: "buy", label: "Buy", color: "#84cc16" };
  }
  if (score >= INVESTMENT_THRESHOLDS.NEUTRAL) {
    return { signal: "neutral", label: "Hold", color: "#eab308" };
  }
  if (score >= INVESTMENT_THRESHOLDS.SELL) {
    return { signal: "sell", label: "Sell", color: "#f97316" };
  }
  return { signal: "strong_sell", label: "Strong Sell", color: "#ef4444" };
}

export function analyzeTopic(
  topic: MarketAsset,
  fetchedAt: string
): TopicNeptuAnalysis {
  const calc = getCalc();
  const today = new Date(fetchedAt);

  const symbol = TOPIC_TO_CRYPTO_MAP[topic.topic];
  const coin = symbol
    ? TOP_CRYPTO_COINS.find((c) => c.symbol === symbol)
    : null;

  const coinBirthDate = coin ? new Date(coin.birthday) : null;
  const peluang = coinBirthDate
    ? calc.calculatePeluang(today, coinBirthDate)
    : calc.calculatePeluang(today);

  const totalUrip = peluang.panca_wara.urip + peluang.sapta_wara.urip;
  const dailyEnergyScore = Math.round((totalUrip / MAX_URIP) * FULL_SCORE);

  const age = coinBirthDate
    ? Math.floor((today.getTime() - coinBirthDate.getTime()) / MS_PER_YEAR)
    : 0;

  const prosperity = getProsperity(totalUrip, age);
  let prosperityLevel = prosperity?.level ?? 0;

  if (!prosperity && age > 0) {
    const periods = getProsperityPeriods(totalUrip);
    if (periods && periods.length > 0) {
      prosperityLevel = periods[periods.length - 1].level;
    }
  }

  const prosperityScore = (prosperityLevel / MAX_PROSPERITY_LEVEL) * FULL_SCORE;
  const levelTranslation =
    PROSPERITY_LEVELS[prosperityLevel as keyof typeof PROSPERITY_LEVELS];
  const prosperityLabel =
    (typeof levelTranslation === "object"
      ? levelTranslation?.en
      : levelTranslation) ?? "Unknown";

  const sentimentWeight = SENTIMENT_CONFIG[topic.sentiment].weight;
  const sentimentBonus = sentimentWeight * SENTIMENT_BONUS_FACTOR;
  const momentumBonus = Math.min(
    topic.count * MOMENTUM_MULTIPLIER,
    MOMENTUM_CAP
  );

  const overallScore = Math.max(
    0,
    Math.min(
      FULL_SCORE,
      Math.round(
        dailyEnergyScore * ENERGY_WEIGHT +
          prosperityScore * PROSPERITY_WEIGHT +
          BASE_SCORE +
          sentimentBonus +
          momentumBonus * MOMENTUM_WEIGHT
      )
    )
  );

  const { signal, label, color } = getInvestmentSignal(overallScore);

  return {
    cosmicAlignmentScore: Math.round((dailyEnergyScore + prosperityScore) / 2),
    prosperityLevel,
    prosperityLabel,
    dailyEnergyScore,
    investmentSignal: signal,
    investmentLabel: label,
    investmentColor: color,
    overallScore,
    relatedCoin: coin?.symbol ?? null,
    coinBirthday: coin?.birthday ?? null,
  };
}

/* ── Person Matching ─────────────────────────────────── */

export interface MatchedPerson {
  person: PersonDTO;
  relevanceScore: number;
  neptuScore: number;
  prosperityLevel: number;
  prosperityLabel: string;
}

function calculatePersonNeptuScore(person: PersonDTO): {
  score: number;
  prosperityLevel: number;
} {
  const calc = getCalc();
  const today = new Date();
  const birthDate = new Date(person.birthday);

  if (isNaN(birthDate.getTime())) {
    return { score: 0, prosperityLevel: 0 };
  }

  const potensi = calc.calculatePotensi(birthDate);
  const peluang = calc.calculatePeluang(today, birthDate);

  const totalUrip = potensi.total_urip;
  const dailyUrip = peluang.panca_wara.urip + peluang.sapta_wara.urip;

  const age = Math.floor((today.getTime() - birthDate.getTime()) / MS_PER_YEAR);

  const prosperity = getProsperity(totalUrip, age);
  let level = prosperity?.level ?? 0;

  if (!prosperity) {
    const periods = getProsperityPeriods(totalUrip);
    if (periods && periods.length > 0) {
      const last = periods[periods.length - 1];
      if (age > last.toAge) level = last.level;
    }
  }

  const score = Math.round(
    (dailyUrip / MAX_URIP) * FULL_SCORE * DAILY_URIP_WEIGHT +
      (level / MAX_PROSPERITY_LEVEL) * FULL_SCORE * PERSON_PROSPERITY_WEIGHT
  );

  return { score, prosperityLevel: level };
}

export function findRelatedPersons(
  topic: MarketAsset,
  persons: PersonDTO[]
): MatchedPerson[] {
  const topicLower = topic.topic.toLowerCase();
  const headlineLower = topic.recentHeadlines.join(" ").toLowerCase();

  return persons
    .filter((p) => {
      const nameLower = p.name.toLowerCase();
      const industryMatch = p.industries?.some((ind) =>
        ind.toLowerCase().includes(topicLower)
      );
      const nameInHeadline = headlineLower.includes(nameLower);
      const categoryMatch = getCategoryMatch(topicLower, p);

      return nameInHeadline || industryMatch || categoryMatch;
    })
    .map((person) => {
      const { score, prosperityLevel } = calculatePersonNeptuScore(person);
      const nameInHeadline = headlineLower.includes(person.name.toLowerCase())
        ? HEADLINE_MATCH_SCORE
        : 0;
      const industryRelevance = person.industries?.some((ind) =>
        ind.toLowerCase().includes(topicLower)
      )
        ? INDUSTRY_MATCH_SCORE
        : 0;

      return {
        person,
        relevanceScore:
          nameInHeadline + industryRelevance + score * PERSON_SCORE_WEIGHT,
        neptuScore: score,
        prosperityLevel,
        prosperityLabel: (() => {
          const trans =
            PROSPERITY_LEVELS[
              prosperityLevel as keyof typeof PROSPERITY_LEVELS
            ];
          return (typeof trans === "object" ? trans?.en : trans) ?? "Unknown";
        })(),
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, MAX_RELATED_PERSONS);
}

/* ── Sentiment Helpers ───────────────────────────────── */

export function getSentimentColor(sentiment: MarketSentiment): string {
  return SENTIMENT_CONFIG[sentiment].color;
}

export function getSentimentLabel(sentiment: MarketSentiment): string {
  return SENTIMENT_CONFIG[sentiment].label;
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < MINUTES_PER_HOUR) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / MINUTES_PER_HOUR);
  if (diffHours < HOURS_PER_DAY) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / HOURS_PER_DAY);
  return `${diffDays}d ago`;
}
