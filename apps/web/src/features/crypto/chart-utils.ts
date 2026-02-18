import type { CosmicPredictionEvent } from "./cosmic-prediction";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartDataPoint {
  date: string;
  fullDate: string;
  timestamp: number;
  price?: number;
  predPrice?: number;
  type?: "ath" | "atl" | "now";
  matchLevel?: "full" | "partial";
  caturWara?: string;
}

export interface CoinGeckoChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtFull = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// ---------------------------------------------------------------------------
// Data Formatter
// ---------------------------------------------------------------------------

export interface FormatPriceDataOptions {
  rawData: CoinGeckoChartData;
  ath?: number | null;
  atl?: number | null;
  athDate?: string | null;
  atlDate?: string | null;
  currentPrice?: number | null;
}

export function formatPriceData({
  rawData,
  ath,
  atl,
  athDate,
  atlDate,
  currentPrice,
}: FormatPriceDataOptions): ChartDataPoint[] {
  const prices = rawData.prices;
  if (!prices?.length) return [];

  const step = Math.max(1, Math.floor(prices.length / 90));
  const sampled = prices.filter(
    (_, i) => i % step === 0 || i === prices.length - 1
  );

  const athTs = athDate ? new Date(athDate).getTime() : null;
  const atlTs = atlDate ? new Date(atlDate).getTime() : null;

  const result = sampled.map(([timestamp, price]) => {
    let type: ChartDataPoint["type"];
    if (
      athTs &&
      Math.abs(timestamp - athTs) < 86400000 * 2 &&
      ath &&
      Math.abs(price - ath) / ath < 0.05
    )
      type = "ath";
    else if (
      atlTs &&
      Math.abs(timestamp - atlTs) < 86400000 * 2 &&
      atl &&
      Math.abs(price - atl) / atl < 0.15
    )
      type = "atl";

    const d = new Date(timestamp);
    return {
      date: fmtShort(d),
      fullDate: fmtFull(d),
      timestamp,
      price: Number(price.toPrecision(6)),
      type,
    };
  });

  // Append today's current price if the last data point is older than today
  if (
    currentPrice !== null &&
    currentPrice !== undefined &&
    result.length > 0
  ) {
    const now = new Date();
    const lastTs = result[result.length - 1].timestamp;
    // If last point is more than 1 hour old, add current price
    if (now.getTime() - lastTs > 3600000) {
      result.push({
        date: fmtShort(now),
        fullDate: fmtFull(now),
        timestamp: now.getTime(),
        price: Number((currentPrice as number).toPrecision(6)),
        type: "now",
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Merge history + prediction
// ---------------------------------------------------------------------------

/**
 * Merge history data with prediction events into one timeline.
 * History uses `price`, predictions use `predPrice`.
 * A bridge point connects them at "now".
 */
export function mergeWithPredictions(
  historyData: ChartDataPoint[],
  events: CosmicPredictionEvent[],
  currentPrice: number
): ChartDataPoint[] {
  if (!events.length) return historyData;

  // Filter: all full matches + first 3 partial per type
  let partialAth = 0;
  let partialAtl = 0;
  const filtered = events.filter((ev) => {
    if (ev.matchLevel === "full") return true;
    if (ev.type === "ath" && partialAth < 3) {
      partialAth++;
      return true;
    }
    if (ev.type === "atl" && partialAtl < 3) {
      partialAtl++;
      return true;
    }
    return false;
  });
  if (!filtered.length) return historyData;

  const now = new Date();
  // Bridge: last history point also starts the prediction line
  const bridge: ChartDataPoint = {
    date: fmtShort(now),
    fullDate: fmtFull(now),
    timestamp: now.getTime(),
    price: currentPrice,
    predPrice: currentPrice,
    type: "now",
  };

  // Build prediction points with midpoints for smooth curves
  const predPoints: ChartDataPoint[] = [];
  let prevTs = bridge.timestamp;
  let prevPrice = currentPrice;

  for (const ev of filtered) {
    // Midpoint
    const midMs = prevTs + (ev.date.getTime() - prevTs) * 0.5;
    const midDate = new Date(midMs);
    const midPrice = prevPrice + (ev.predictedPrice - prevPrice) * 0.4;
    predPoints.push({
      date: fmtShort(midDate),
      fullDate: fmtFull(midDate),
      timestamp: midMs,
      predPrice: Number(midPrice.toPrecision(6)),
    });

    // Event point
    predPoints.push({
      date: fmtShort(ev.date),
      fullDate: fmtFull(ev.date),
      timestamp: ev.date.getTime(),
      predPrice: ev.predictedPrice,
      type: ev.type,
      matchLevel: ev.matchLevel,
      caturWara: ev.caturWara,
    });

    prevTs = ev.date.getTime();
    prevPrice = ev.predictedPrice;
  }

  // Merge: history (without last duplicate if near "now") + bridge + predictions
  const hist = historyData.filter(
    (p) => p.timestamp < now.getTime() - 86400000
  );
  return [...hist, bridge, ...predPoints];
}
