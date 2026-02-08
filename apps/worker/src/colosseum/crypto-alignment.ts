/**
 * Crypto Cosmic Alignment — helpers for crypto post generation
 * Price position, Fibonacci levels, alignment scoring, forecasting
 */

import type { NeptuCalculator } from "@neptu/wariga";
import { getWukuMeaning } from "./forum-constants";
import type { CryptoCoin } from "./crypto-birthdays";

export interface CoinReading {
  coin: CryptoCoin;
  alignment: number;
  trend: "bullish" | "bearish" | "neutral";
  energy: string;
  action: string;
}

export interface CoinReadingWithMarket extends CoinReading {
  market?: import("./crypto-market-fetcher").CryptoWithMarketData;
  pricePosition?: number;
  fibLevel?: string;
  prediction?: string;
}

/**
 * Calculate price position between ATL and ATH (0-100%)
 */
export function calculatePricePosition(
  current: number,
  ath: number,
  atl: number,
): number {
  if (ath === atl) return 50;
  return Math.round(((current - atl) / (ath - atl)) * 100);
}

/**
 * Get Fibonacci retracement level
 */
export function getFibonacciLevel(pricePosition: number): string {
  if (pricePosition >= 100) return "ATH Zone 🔥";
  if (pricePosition >= 78.6) return "78.6% (Strong Resistance)";
  if (pricePosition >= 61.8) return "61.8% (Golden Zone)";
  if (pricePosition >= 50) return "50% (Mid Range)";
  if (pricePosition >= 38.2) return "38.2% (Support Zone)";
  if (pricePosition >= 23.6) return "23.6% (Key Support)";
  if (pricePosition > 0) return "Near ATL Zone 📉";
  return "ATL Zone 🔻";
}

/**
 * Generate cosmic prediction based on alignment and price position
 */
export function generatePrediction(
  alignment: number,
  pricePosition: number,
  trend: string,
): string {
  if (alignment >= 80 && pricePosition < 50) {
    return "🚀 STRONG ACCUMULATION - High cosmic alignment + undervalued position";
  }
  if (alignment >= 70 && trend === "bullish") {
    return "📈 Favorable momentum - Cosmic winds support upward movement";
  }
  if (alignment >= 60 && pricePosition >= 50 && pricePosition < 80) {
    return "➡️ HOLD - Balanced energy, wait for clearer signals";
  }
  if (alignment < 50 && pricePosition > 80) {
    return "⚠️ CAUTION - Low alignment + near ATH = potential correction";
  }
  if (pricePosition < 20) {
    return "🔍 WATCH - Near historical lows, high risk/reward";
  }
  return "⚖️ NEUTRAL - Mixed signals, DYOR";
}

/**
 * Calculate cosmic alignment score for a coin based on its birthday
 */
export function calculateCoinAlignment(
  calculator: NeptuCalculator,
  coinBirthday: Date,
  today: Date,
): {
  alignment: number;
  trend: "bullish" | "bearish" | "neutral";
  energy: string;
  action: string;
} {
  const birthReading = calculator.calculatePotensi(coinBirthday);
  const todayReading = calculator.calculatePeluang(coinBirthday, today);

  const birthUrip = birthReading.total_urip;
  const todayUrip = todayReading.total_urip;

  const baseAlignment = Math.min(
    100,
    Math.round(((birthUrip + todayUrip) / 40) * 100),
  );

  const birthFreq = birthReading.frekuensi?.name || "";
  const todayFreq = todayReading.frekuensi?.name || "";

  let trend: "bullish" | "bearish" | "neutral" = "neutral";
  let energy = "";
  let action = "";

  if (birthFreq === todayFreq) {
    trend = "bullish";
    energy = `Perfect ${birthFreq} resonance - peak momentum`;
    action = "Strong buy signals";
  } else if (todayUrip >= 15) {
    trend = "bullish";
    energy = `High ${todayReading.frekuensi?.name || "energy"} day - favorable winds`;
    action = "Accumulation favored";
  } else if (todayUrip <= 8) {
    trend = "bearish";
    energy = `Low energy cycle - consolidation period`;
    action = "Hold or reduce exposure";
  } else {
    trend = "neutral";
    energy = `Mixed ${todayReading.frekuensi?.name || "energy"} signals`;
    action = "Watch and wait";
  }

  const wukuName = todayReading.wuku?.name || "";
  if (wukuName) {
    const wukuMeaning = getWukuMeaning(wukuName);
    if (wukuMeaning.includes("growth") || wukuMeaning.includes("prosperity")) {
      trend = "bullish";
    }
  }

  return { alignment: baseAlignment, trend, energy, action };
}

/**
 * Generate cosmic forecast for next N key dates
 */
export function generateCosmicForecast(
  calculator: NeptuCalculator,
  coinBirthday: Date,
  startDate: Date,
  count: number,
): Array<{
  date: string;
  wuku: string;
  energy: string;
  action: string;
}> {
  const forecasts: Array<{
    date: string;
    wuku: string;
    energy: string;
    action: string;
  }> = [];
  const msPerDay = 24 * 60 * 60 * 1000;

  for (let i = 1; i <= 35 && forecasts.length < count; i += 7) {
    const checkDate = new Date(startDate.getTime() + i * msPerDay);
    const reading = calculator.calculatePeluang(coinBirthday, checkDate);
    const potensi = calculator.calculatePotensi(checkDate);

    const wukuName = potensi.wuku?.name || "Unknown";
    const urip = reading.total_urip;

    let energy = "Neutral";
    let action = "Hold & observe";

    if (urip >= 15) {
      energy = "High 🔥";
      action = "Favorable for action";
      forecasts.push({
        date: checkDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        wuku: wukuName,
        energy,
        action,
      });
    } else if (urip <= 8) {
      energy = "Low ❄️";
      action = "Rest & consolidate";
      forecasts.push({
        date: checkDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        wuku: wukuName,
        energy,
        action,
      });
    }
  }

  if (forecasts.length < count) {
    for (let i = 7; i <= 28 && forecasts.length < count; i += 7) {
      const checkDate = new Date(startDate.getTime() + i * msPerDay);
      const potensi = calculator.calculatePotensi(checkDate);
      forecasts.push({
        date: checkDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        wuku: potensi.wuku?.name || "Unknown",
        energy: "Moderate ⚖️",
        action: "Standard operations",
      });
    }
  }

  return forecasts.slice(0, count);
}
