/**
 * Billionaire Snapshot Fetcher
 * Fetches Forbes billionaire data, computes Neptu astrology scores,
 * and stores daily snapshots for historical tracking.
 */

import type { NewBillionaireSnapshot } from "@neptu/drizzle-orm";

import {
  type Database,
  PersonService,
  BillionaireTrackingService,
  type BillionaireSnapshotBatch,
  type ForbesFinancialAsset,
} from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import {
  BILLIONAIRE_TRACKING,
  FORBES_WEALTH_FLOW_API,
  getProsperity,
  getProsperityPeriods,
} from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";

const log = createLogger({ name: "billionaire-snapshot" });

/* ── Forbes API Types ────────────────────────────────── */

interface ForbesPersonRaw {
  rank: number;
  personName: string;
  finalWorth: number;
  estWorthPrev: number;
  privateAssetsWorth?: number;
  uri: string;
  industries?: string[];
  countryOfCitizenship?: string;
  source?: string;
  squareImage?: string;
  birthDate?: number;
  financialAssets?: ForbesFinancialAsset[];
}

/* ── Helpers ─────────────────────────────────────────── */

function calculateAge(birthday: string): number | null {
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

function getProsperityWithFallback(
  totalUrip: number,
  age: number
): { level: number } | null {
  const direct = getProsperity(totalUrip, age);
  if (direct) return direct;

  const periods = getProsperityPeriods(totalUrip);
  if (!periods || periods.length === 0) return null;

  const last = periods[periods.length - 1];
  if (age > last.toAge) return { level: last.level };
  return null;
}

/* ── Neptu Score Calculator ──────────────────────────── */

interface NeptuScores {
  prosperityScore: number | null;
  dailyEnergyScore: number | null;
  uripPeluangScore: number | null;
  compatibilityScore: number | null;
  neptuAlphaScore: number | null;
}

const {
  MAX_SCORE,
  MAX_URIP,
  MAX_PROSPERITY_LEVEL,
  WEIGHT_PROSPERITY,
  WEIGHT_DAILY_ENERGY,
  WEIGHT_URIP_PELUANG,
  WEIGHT_COMPATIBILITY,
} = BILLIONAIRE_TRACKING;

function computeNeptuScores(
  calculator: NeptuCalculator,
  birthday: string,
  allBirthdays: string[]
): NeptuScores {
  const nullScores: NeptuScores = {
    prosperityScore: null,
    dailyEnergyScore: null,
    uripPeluangScore: null,
    compatibilityScore: null,
    neptuAlphaScore: null,
  };

  try {
    const birthDate = new Date(birthday);
    const today = new Date();

    /* Prosperity */
    const potensi = calculator.calculatePotensi(birthDate);
    const totalUrip = potensi.total_urip;
    const age = calculateAge(birthday);
    let prosperityScore: number | null = null;
    if (age !== null) {
      const prosperity = getProsperityWithFallback(totalUrip, age);
      if (prosperity) {
        prosperityScore = (prosperity.level / MAX_PROSPERITY_LEVEL) * MAX_SCORE;
      }
    }

    /* Daily energy (compatibility with today) */
    let dailyEnergyScore: number | null = null;
    try {
      const compat = calculator.calculateCompatibility(birthDate, today);
      dailyEnergyScore = compat.scores.overall;
    } catch {
      /* skip */
    }

    /* Urip peluang (today's opportunity for this birth date) */
    let uripPeluangScore: number | null = null;
    try {
      const peluang = calculator.calculatePeluang(today, birthDate);
      uripPeluangScore = (peluang.total_urip / MAX_URIP) * MAX_SCORE;
    } catch {
      /* skip */
    }

    /* Compatibility (average vs all other billionaires) */
    let compatibilityScore: number | null = null;
    const otherBirthdays = allBirthdays.filter((b) => b !== birthday);
    if (otherBirthdays.length > 0) {
      const scores: number[] = [];
      for (const other of otherBirthdays) {
        try {
          const result = calculator.calculateCompatibility(
            birthDate,
            new Date(other)
          );
          scores.push(result.scores.overall);
        } catch {
          /* skip invalid */
        }
      }
      if (scores.length > 0) {
        compatibilityScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    /* Neptu Alpha — weighted composite */
    const parts: Array<{ score: number | null; weight: number }> = [
      { score: prosperityScore, weight: WEIGHT_PROSPERITY },
      { score: dailyEnergyScore, weight: WEIGHT_DAILY_ENERGY },
      { score: uripPeluangScore, weight: WEIGHT_URIP_PELUANG },
      { score: compatibilityScore, weight: WEIGHT_COMPATIBILITY },
    ];
    const valid = parts.filter((p) => p.score !== null) as Array<{
      score: number;
      weight: number;
    }>;
    let neptuAlphaScore: number | null = null;
    if (valid.length > 0) {
      const totalWeight = valid.reduce((s, p) => s + p.weight, 0);
      neptuAlphaScore = Math.round(
        valid.reduce((s, p) => s + p.score * (p.weight / totalWeight), 0)
      );
    }

    return {
      prosperityScore,
      dailyEnergyScore,
      uripPeluangScore,
      compatibilityScore,
      neptuAlphaScore,
    };
  } catch (error) {
    log.warn({ birthday, error }, "Failed to compute Neptu scores");
    return nullScores;
  }
}

/* ── Main: Fetch Forbes + Compute Neptu + Build Batch ── */

export async function createBillionaireSnapshots(
  db: Database
): Promise<{ snapshotCount: number; summaryDate: string }> {
  const today = new Date().toISOString().slice(0, 10);

  log.info({ date: today }, "Starting daily billionaire snapshot");

  /* 1. Fetch Forbes data */
  const forbesUrl = `${FORBES_WEALTH_FLOW_API.URL}?limit=${BILLIONAIRE_TRACKING.FORBES_LIMIT}`;
  const res = await fetch(forbesUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": BILLIONAIRE_TRACKING.USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Forbes API HTTP ${res.status}`);
  }

  const raw = (await res.json()) as {
    personList: { personsLists: ForbesPersonRaw[] };
  };
  const forbesPeople = raw.personList?.personsLists ?? [];
  log.info({ count: forbesPeople.length }, "Forbes data fetched");

  /* 2. Match Forbes people to persons by name */
  const figureService = new PersonService(db);
  const allFigures = await figureService.list({
    category: "billionaire",
    limit: 200,
    offset: 0,
  });

  const figureMap = new Map<string, { id: string; birthday: string }>();
  for (const f of allFigures) {
    figureMap.set(f.name.toLowerCase().trim(), {
      id: f.id,
      birthday: f.birthday,
    });
  }

  /* 3. Compute Neptu scores & build snapshots */
  const calculator = new NeptuCalculator();
  const allBirthdays = allFigures.map((f) => f.birthday).filter(Boolean);

  const snapshots: NewBillionaireSnapshot[] = [];
  let topGainerId: string | null = null;
  let topGainerChange = -Infinity;
  let topLoserId: string | null = null;
  let topLoserChange = Infinity;
  let totalNetWorth = 0;
  let totalDailyChange = 0;

  const prosperityScores: number[] = [];
  const dailyEnergyScores: number[] = [];
  const uripPeluangScores: number[] = [];
  const compatibilityScores: number[] = [];

  for (const person of forbesPeople) {
    const nameKey = person.personName.toLowerCase().trim();
    const figure = figureMap.get(nameKey);
    if (!figure) continue;

    const netWorth = person.finalWorth / FORBES_WEALTH_FLOW_API.WORTH_DIVISOR;
    const prevWorth =
      person.estWorthPrev / FORBES_WEALTH_FLOW_API.WORTH_DIVISOR;
    const dailyChange = Math.round((netWorth - prevWorth) * 100) / 100;
    const privateAssets = person.privateAssetsWorth
      ? Math.round(
          (person.privateAssetsWorth / FORBES_WEALTH_FLOW_API.WORTH_DIVISOR) *
            100
        ) / 100
      : null;

    const neptu = computeNeptuScores(calculator, figure.birthday, allBirthdays);

    const snapshot: NewBillionaireSnapshot = {
      figureId: figure.id,
      snapshotDate: today,
      forbesRank: person.rank,
      netWorthBillions: Math.round(netWorth * 100) / 100,
      dailyChangeBillions: dailyChange,
      privateAssetsWorth: privateAssets,
      country: person.countryOfCitizenship ?? null,
      industry: person.industries?.[0] ?? null,
      wealthSource: person.source ?? null,
      financialAssets: person.financialAssets ?? [],
      ...neptu,
    };
    snapshots.push(snapshot);

    totalNetWorth += snapshot.netWorthBillions;
    totalDailyChange += dailyChange;

    if (dailyChange > topGainerChange) {
      topGainerChange = dailyChange;
      topGainerId = figure.id;
    }
    if (dailyChange < topLoserChange) {
      topLoserChange = dailyChange;
      topLoserId = figure.id;
    }

    if (neptu.prosperityScore !== null)
      prosperityScores.push(neptu.prosperityScore);
    if (neptu.dailyEnergyScore !== null)
      dailyEnergyScores.push(neptu.dailyEnergyScore);
    if (neptu.uripPeluangScore !== null)
      uripPeluangScores.push(neptu.uripPeluangScore);
    if (neptu.compatibilityScore !== null)
      compatibilityScores.push(neptu.compatibilityScore);
  }

  if (snapshots.length === 0) {
    log.warn("No billionaires matched to persons — skipping snapshot");
    return { snapshotCount: 0, summaryDate: today };
  }

  /* 4. Compute aggregates */
  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const avgProsperity = avg(prosperityScores);
  const avgDailyEnergy = avg(dailyEnergyScores);
  const avgUripPeluang = avg(uripPeluangScores);
  const avgCompatibility = avg(compatibilityScores);

  /* Neptu sentiment = weighted average of 4 dimensions */
  const sentimentParts: Array<{ val: number | null; w: number }> = [
    { val: avgProsperity, w: WEIGHT_PROSPERITY },
    { val: avgDailyEnergy, w: WEIGHT_DAILY_ENERGY },
    { val: avgUripPeluang, w: WEIGHT_URIP_PELUANG },
    { val: avgCompatibility, w: WEIGHT_COMPATIBILITY },
  ];
  const validParts = sentimentParts.filter((p) => p.val !== null) as Array<{
    val: number;
    w: number;
  }>;
  const neptuSentiment =
    validParts.length > 0
      ? Math.round(
          validParts.reduce(
            (s, p) =>
              s + p.val * (p.w / validParts.reduce((tw, pp) => tw + pp.w, 0)),
            0
          )
        )
      : null;

  const batch: BillionaireSnapshotBatch = {
    snapshots,
    summary: {
      summaryDate: today,
      billionaireCount: snapshots.length,
      totalNetWorthBillions: Math.round(totalNetWorth * 100) / 100,
      totalDailyChangeBillions: Math.round(totalDailyChange * 100) / 100,
      avgNetWorthBillions:
        Math.round((totalNetWorth / snapshots.length) * 100) / 100,
      avgProsperityScore: avgProsperity
        ? Math.round(avgProsperity * 100) / 100
        : null,
      avgDailyEnergyScore: avgDailyEnergy
        ? Math.round(avgDailyEnergy * 100) / 100
        : null,
      avgUripPeluangScore: avgUripPeluang
        ? Math.round(avgUripPeluang * 100) / 100
        : null,
      avgCompatibilityScore: avgCompatibility
        ? Math.round(avgCompatibility * 100) / 100
        : null,
      neptuSentimentScore: neptuSentiment,
      topGainerId,
      topGainerChange: topGainerChange === -Infinity ? null : topGainerChange,
      topLoserId,
      topLoserChange: topLoserChange === Infinity ? null : topLoserChange,
    },
  };

  /* 5. Persist to DB */
  const trackingService = new BillionaireTrackingService(db);
  const result = await trackingService.recordDailySnapshots(batch);

  log.info(
    {
      snapshotCount: result.snapshotCount,
      date: today,
      sentiment: neptuSentiment,
    },
    "Daily billionaire snapshot completed"
  );

  return { snapshotCount: result.snapshotCount, summaryDate: today };
}
