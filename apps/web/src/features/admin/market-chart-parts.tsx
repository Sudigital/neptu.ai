import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Minus,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartPoint, FibonacciLevel } from "./world-economic-parts";

import { formatCurrency, formatShortDate } from "./world-economic-parts";

/* ── Constants ───────────────────────────────────────── */

const CHART_HEIGHT = 220;
const FULL = 100;
const GAUGE_CX = 80;
const GAUGE_CY = 80;
const GAUGE_R = 60;
const GAUGE_NEEDLE_LEN = 50;

export const FG_DIVERGENCE_THRESHOLD = 2;

export const FG_ZONES = [
  { min: 0, max: 24, label: "Extreme Fear", color: "#ef4444" },
  { min: 25, max: 44, label: "Fear", color: "#f97316" },
  { min: 45, max: 55, label: "Neutral", color: "#eab308" },
  { min: 56, max: 75, label: "Greed", color: "#84cc16" },
  { min: 76, max: 100, label: "Extreme Greed", color: "#22c55e" },
] as const;

const FIB_COLORS: Record<string, string> = {
  "0%": "#22c55e",
  "23.6%": "#84cc16",
  "38.2%": "#eab308",
  "50%": "#f97316",
  "61.8%": "#ef4444",
  "78.6%": "#dc2626",
  "100%": "#991b1b",
};

export type Interpretation = "bullish" | "bearish" | "neutral";

/* ── Helpers ─────────────────────────────────────────── */

export function getFgZone(score: number) {
  return FG_ZONES.find((z) => score >= z.min && score <= z.max) ?? FG_ZONES[2];
}

export function interpretFunding(interp?: string): Interpretation {
  if (interp === "overleveraged_long") return "bearish";
  if (interp === "overleveraged_short") return "bullish";
  return "neutral";
}

/* ── Types ───────────────────────────────────────────── */

export interface FearGreedEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

export interface FearGreedResponse {
  name: string;
  data: FearGreedEntry[];
}

export interface FundingRateResult {
  success: boolean;
  rate: number;
  ratePercent: number;
  interpretation: "neutral" | "overleveraged_long" | "overleveraged_short";
}

export interface OpenInterestResult {
  success: boolean;
  openInterest: number;
  symbol: string;
}

/* ── Mini Gauge ──────────────────────────────────────── */

export function MiniGauge({
  score,
  zones,
}: {
  score: number;
  zones: ReadonlyArray<{ min: number; max: number; color: string }>;
}) {
  const needleAngle = Math.PI - (score / FULL) * Math.PI;
  const nx = GAUGE_CX + GAUGE_NEEDLE_LEN * Math.cos(needleAngle);
  const ny = GAUGE_CY - GAUGE_NEEDLE_LEN * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 160 95" className="w-full max-w-[140px]">
      {zones.map((zone) => {
        const s = Math.PI - (zone.min / FULL) * Math.PI;
        const e = Math.PI - (zone.max / FULL) * Math.PI;
        const x1 = GAUGE_CX + GAUGE_R * Math.cos(s);
        const y1 = GAUGE_CY - GAUGE_R * Math.sin(s);
        const x2 = GAUGE_CX + GAUGE_R * Math.cos(e);
        const y2 = GAUGE_CY - GAUGE_R * Math.sin(e);
        return (
          <path
            key={`${zone.min}-${zone.max}`}
            d={`M ${x1} ${y1} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke={zone.color}
            strokeWidth={8}
            strokeLinecap="butt"
          />
        );
      })}
      <line
        x1={GAUGE_CX}
        y1={GAUGE_CY}
        x2={nx}
        y2={ny}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={GAUGE_CX} cy={GAUGE_CY} r={2.5} fill="currentColor" />
    </svg>
  );
}

/* ── Chart Tooltip ───────────────────────────────────── */

export function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{data.fullDate}</p>
      <p className="font-bold text-primary">{formatCurrency(data.price)}</p>
    </div>
  );
}

/* ── Signal Badge ────────────────────────────────────── */

export function SignalBadge({
  label,
  value,
  interpretation,
}: {
  label: string;
  value: string;
  interpretation: Interpretation;
}) {
  const bg = {
    bullish: "bg-emerald-100 dark:bg-emerald-900/30",
    bearish: "bg-red-100 dark:bg-red-900/30",
    neutral: "bg-yellow-100 dark:bg-yellow-900/30",
  };
  const text = {
    bullish: "text-emerald-700 dark:text-emerald-400",
    bearish: "text-red-700 dark:text-red-400",
    neutral: "text-yellow-700 dark:text-yellow-400",
  };
  const Icons = { bullish: ArrowUp, bearish: ArrowDown, neutral: Minus };
  const Icon = Icons[interpretation];

  return (
    <div className="rounded-md border p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-bold ${text[interpretation]}`}>
        {value}
      </div>
      <div
        className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${bg[interpretation]} ${text[interpretation]}`}
      >
        <Icon className="h-2.5 w-2.5" />
        {interpretation.charAt(0).toUpperCase() + interpretation.slice(1)}
      </div>
    </div>
  );
}

/* ── Price Chart ─────────────────────────────────────── */

export function PriceChart({
  chartData,
  fibLevels,
  isLoading,
  error,
  coinName,
}: {
  chartData: ChartPoint[];
  fibLevels: FibonacciLevel[];
  isLoading: boolean;
  error: boolean;
  coinName: string;
}) {
  if (isLoading) {
    return (
      <div className="flex h-[220px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-xs">Loading {coinName} chart...</span>
      </div>
    );
  }
  if (error || chartData.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-muted-foreground">
        <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
        <span className="text-xs">Failed to load chart data</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <ComposedChart
        data={chartData}
        margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(ts: number) => formatShortDate(new Date(ts))}
          tick={{ fontSize: 10 }}
          className="text-muted-foreground"
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          className="text-muted-foreground"
          tickFormatter={(v: number) => formatCurrency(v).replace("$", "")}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} />
        {fibLevels.map((fib) => (
          <ReferenceLine
            key={fib.label}
            y={fib.price}
            stroke={FIB_COLORS[fib.label] ?? "#94a3b8"}
            strokeDasharray="6 3"
            strokeWidth={1}
            label={{
              value: `${fib.label} ${formatCurrency(fib.price)}`,
              position: "insideTopRight",
              fill: FIB_COLORS[fib.label] ?? "#94a3b8",
              fontSize: 8,
            }}
          />
        ))}
        <ReferenceLine
          x={Date.now()}
          stroke="#6366f1"
          strokeDasharray="4 3"
          strokeWidth={1.5}
          label={{
            value: "Now",
            position: "insideTopRight",
            fill: "#6366f1",
            fontSize: 9,
            fontWeight: 600,
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#trendGrad)"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ── Fear & Greed Card Content ───────────────────────── */

export function FearGreedContent({
  loading,
  score,
  zone,
}: {
  loading: boolean;
  score: number | null;
  zone: ReturnType<typeof getFgZone> | null;
}) {
  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (score === null || !zone) {
    return (
      <div className="flex h-20 items-center justify-center text-[10px] text-muted-foreground">
        No data
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <MiniGauge score={score} zones={FG_ZONES} />
      <div className="text-lg font-bold" style={{ color: zone.color }}>
        {score}
      </div>
      <div className="text-[10px] font-semibold" style={{ color: zone.color }}>
        {zone.label}
      </div>
    </div>
  );
}

/* ── Market Signal Card ──────────────────────────────── */

export function MarketSignalCard({
  fgScore,
  priceChange,
  fundingInterp,
  hasFunding,
}: {
  fgScore: number | null;
  priceChange: number | null;
  fundingInterp: Interpretation;
  hasFunding: boolean;
}) {
  const signals: Interpretation[] = [];
  if (fgScore !== null) {
    if (fgScore <= FG_ZONES[0].max) signals.push("bullish");
    else if (fgScore >= FG_ZONES[3].min) signals.push("bearish");
    else signals.push("neutral");
  }
  if (priceChange !== null) {
    if (priceChange > FG_DIVERGENCE_THRESHOLD) signals.push("bullish");
    else if (priceChange < -FG_DIVERGENCE_THRESHOLD) signals.push("bearish");
    else signals.push("neutral");
  }
  if (hasFunding) signals.push(fundingInterp);

  const bullish = signals.filter((s) => s === "bullish").length;
  const bearish = signals.filter((s) => s === "bearish").length;
  let overall: Interpretation = "neutral";
  let signalLabel = "Hold";
  if (bullish > bearish) {
    overall = "bullish";
    signalLabel = bullish >= FG_DIVERGENCE_THRESHOLD ? "Strong Buy" : "Buy";
  } else if (bearish > bullish) {
    overall = "bearish";
    signalLabel = bearish >= FG_DIVERGENCE_THRESHOLD ? "Strong Sell" : "Sell";
  }

  const colors = {
    bullish: "text-emerald-600 dark:text-emerald-400",
    bearish: "text-red-600 dark:text-red-400",
    neutral: "text-yellow-600 dark:text-yellow-400",
  };
  const Icons = { bullish: ArrowUp, bearish: ArrowDown, neutral: Minus };
  const Icon = Icons[overall];

  return (
    <div className="flex h-20 flex-col items-center justify-center">
      <Icon className={`h-6 w-6 ${colors[overall]}`} />
      <div className={`mt-1 text-lg font-bold ${colors[overall]}`}>
        {signalLabel}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {bullish}B / {signals.length - bullish - bearish}N / {bearish}S
      </div>
    </div>
  );
}
