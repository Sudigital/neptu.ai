/**
 * Cosmic Prediction Engine
 *
 * Uses the Neptu Wuku Calendar to predict ATH/ATL windows by matching
 * cosmic energy signatures from historical extreme events.
 *
 * Price differentiation uses two real data-based factors:
 * 1. CaturWara (4-day cycle) — the ONLY cycle that varies across 210-day
 *    Wuku repeats (210 mod 4 = 2), giving each full match a distinct resonance.
 * 2. Time decay — further predictions carry less certainty.
 */
import { NeptuCalculator } from "@neptu/wariga";

import type { CryptoWithMarketData } from "./crypto-utils";

let _calc: NeptuCalculator | null = null;
function getCalc(): NeptuCalculator {
  if (!_calc) _calc = new NeptuCalculator();
  return _calc;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CosmicSignature {
  saptaWara: string;
  pancaWara: string;
  wuku: string;
  saptaUrip: number;
  pancaUrip: number;
  wukuUrip: number;
  caturWara: string;
  frekuensi: string;
}

export interface CosmicPredictionEvent {
  date: Date;
  type: "ath" | "atl";
  matchLevel: "full" | "partial";
  wuku: string;
  wukuUrip: number;
  predictedPrice: number;
  cosmicScore: number;
  caturWara: string;
  frekuensi: string;
}

export interface PredictionSummary {
  events: CosmicPredictionEvent[];
  athSignature: CosmicSignature;
  atlSignature: CosmicSignature;
  birthSignature: CosmicSignature;
  currentPrice: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSignature(date: Date, birthday?: Date): CosmicSignature {
  const calc = getCalc();
  const reading = birthday
    ? calc.calculatePeluang(date, birthday)
    : calc.calculatePotensi(date);
  const catur = calc.getCaturWara(date);
  return {
    saptaWara: reading.sapta_wara.name,
    pancaWara: reading.panca_wara.name,
    wuku: reading.wuku.name,
    saptaUrip: reading.sapta_wara.urip,
    pancaUrip: reading.panca_wara.urip,
    wukuUrip: reading.wuku.urip,
    caturWara: catur.name,
    frekuensi: reading.frekuensi.name,
  };
}

// ---------------------------------------------------------------------------
// Main Analysis
// ---------------------------------------------------------------------------

export function analyzeCrypto(
  crypto: CryptoWithMarketData,
): PredictionSummary | null {
  if (!crypto.birthday || !crypto.athDate || !crypto.atlDate) return null;

  const calc = getCalc();
  const birthday = new Date(crypto.birthday);
  const athDate = new Date(crypto.athDate);
  const atlDate = new Date(crypto.atlDate);

  const birthSig = getSignature(birthday);
  const athSig = getSignature(athDate, birthday);
  const atlSig = getSignature(atlDate, birthday);

  const currentPrice = crypto.currentPrice ?? 0;
  if (currentPrice <= 0) return null;

  const ath = crypto.ath ?? currentPrice;
  const atl = crypto.atl ?? currentPrice;

  // CaturWara value at historical ATH/ATL — the ONLY cycle that changes
  // across 210-day Wuku repeats (210 mod 4 = 2)
  const athCaturVal = calc.getCaturWara(athDate).value;
  const atlCaturVal = calc.getCaturWara(atlDate).value;

  const events: CosmicPredictionEvent[] = [];
  const now = new Date();

  for (let i = 1; i <= 730; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);

    const sapta = calc.getSaptaWara(d);
    const panca = calc.getPancaWara(d);
    const wuku = calc.getWuku(d);

    // Time decay: further out = less certainty (halves at ~500 days)
    const timeDecay = 1 / (1 + i / 500);

    // ATH signature match (same PancaWara + SaptaWara)
    if (sapta.name === athSig.saptaWara && panca.name === athSig.pancaWara) {
      const isFullMatch = wuku.name === athSig.wuku;
      const dayCatur = calc.getCaturWara(d);

      // CaturWara resonance: same CaturWara as ATH = strongest pull
      const caturResonance = dayCatur.value === athCaturVal ? 1.0 : 0.55;

      // Base pull: how strongly this date pulls toward ATH
      const basePull = isFullMatch ? 0.7 : 0.2;
      const pull = basePull * caturResonance * (0.4 + 0.6 * timeDecay);
      const predicted = currentPrice + (ath - currentPrice) * pull;

      const totalUrip = calc.getWuku(birthday).urip + panca.urip + sapta.urip;
      const score = Math.min(100, Math.round((totalUrip / 30) * 100));

      events.push({
        date: new Date(d),
        type: "ath",
        matchLevel: isFullMatch ? "full" : "partial",
        wuku: wuku.name,
        wukuUrip: wuku.urip,
        predictedPrice: Number(predicted.toPrecision(6)),
        cosmicScore: score,
        caturWara: dayCatur.name,
        frekuensi: athSig.frekuensi,
      });
    }

    // ATL signature match (same PancaWara + SaptaWara)
    if (sapta.name === atlSig.saptaWara && panca.name === atlSig.pancaWara) {
      const isFullMatch = wuku.name === atlSig.wuku;
      const dayCatur = calc.getCaturWara(d);

      const caturResonance = dayCatur.value === atlCaturVal ? 1.0 : 0.55;

      const basePull = isFullMatch ? 0.6 : 0.15;
      const pull = basePull * caturResonance * (0.4 + 0.6 * timeDecay);
      const predicted = currentPrice - (currentPrice - atl) * pull;

      const totalUrip = calc.getWuku(birthday).urip + panca.urip + sapta.urip;
      const score = Math.min(100, Math.round((totalUrip / 30) * 100));

      events.push({
        date: new Date(d),
        type: "atl",
        matchLevel: isFullMatch ? "full" : "partial",
        wuku: wuku.name,
        wukuUrip: wuku.urip,
        predictedPrice: Number(predicted.toPrecision(6)),
        cosmicScore: score,
        caturWara: dayCatur.name,
        frekuensi: atlSig.frekuensi,
      });
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    events,
    athSignature: athSig,
    atlSignature: atlSig,
    birthSignature: birthSig,
    currentPrice,
  };
}

// ---------------------------------------------------------------------------
// Chart Data Helpers
// ---------------------------------------------------------------------------

/**
 * Get the next strongest prediction for ATH and ATL.
 * Prefers full matches, falls back to partial.
 */
export function getNextStrongest(summary: PredictionSummary) {
  const athFull = summary.events.find(
    (e) => e.type === "ath" && e.matchLevel === "full",
  );
  const athPartial = summary.events.find(
    (e) => e.type === "ath" && e.matchLevel === "partial",
  );
  const atlFull = summary.events.find(
    (e) => e.type === "atl" && e.matchLevel === "full",
  );
  const atlPartial = summary.events.find(
    (e) => e.type === "atl" && e.matchLevel === "partial",
  );

  return {
    nextATH: athFull ?? athPartial ?? null,
    nextATL: atlFull ?? atlPartial ?? null,
  };
}
