import { Badge } from "@/components/ui/badge";
import React from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

import type { ChartDataPoint } from "./chart-utils";

import { formatCurrency } from "./crypto-utils";

// ---------------------------------------------------------------------------
// CustomTooltip
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as ChartDataPoint;
  const displayPrice = data.predPrice ?? data.price;
  if (displayPrice === null || displayPrice === undefined) return null;

  const hasPredPrice = data.predPrice !== null && data.predPrice !== undefined;
  let typeLabel: string | null = null;
  if (data.type === "ath") {
    typeLabel = hasPredPrice ? "ATH Prediction" : "ATH";
  } else if (data.type === "atl") {
    typeLabel = hasPredPrice ? "ATL Prediction" : "ATL";
  } else if (data.type === "now") {
    typeLabel = "Current";
  }

  let typeColor = "#a855f7";
  if (data.type === "ath") {
    typeColor = "#22c55e";
  } else if (data.type === "atl") {
    typeColor = "#ef4444";
  }

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{data.fullDate}</p>
      <p className="font-bold" style={{ color: typeColor }}>
        {formatCurrency(displayPrice)}
      </p>
      {typeLabel && (
        <Badge
          variant="outline"
          className="mt-1 text-[10px]"
          style={{ borderColor: typeColor, color: typeColor }}
        >
          {typeLabel}
          {data.matchLevel === "full" ? " ● Full" : ""}
          {data.caturWara ? ` ● ${data.caturWara}` : ""}
        </Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unified PriceChart — history + optional prediction overlay
// ---------------------------------------------------------------------------

export function PriceChart({
  data,
  showPrediction,
  ath,
  atl,
  currentPrice,
}: {
  data: ChartDataPoint[];
  showPrediction?: boolean;
  ath?: number | null;
  atl?: number | null;
  currentPrice?: number;
}) {
  const hasPred =
    showPrediction &&
    data.some((d) => d.predPrice !== null && d.predPrice !== undefined);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickFormatter={(v: number) => formatCurrency(v).replace("$", "")}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        {atl !== null && atl !== undefined && (
          <ReferenceLine
            y={atl}
            stroke="#ef4444"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
        )}
        {ath !== null && ath !== undefined && (
          <ReferenceLine
            y={ath}
            stroke="#22c55e"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
        )}
        {currentPrice !== null && currentPrice !== undefined && (
          <ReferenceLine
            y={currentPrice}
            stroke="#a855f7"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
          />
        )}

        {/* Historical price area */}
        <Area
          type="monotone"
          dataKey="price"
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#histGrad)"
          connectNulls={false}
          dot={false}
        />

        {/* Prediction line overlay */}
        {hasPred && (
          <Area
            type="monotone"
            dataKey="predPrice"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#predGrad)"
            connectNulls={false}
            dot={(props: Record<string, unknown>) => {
              const cx = props.cx as number | undefined;
              const cy = props.cy as number | undefined;
              const pl = props.payload as ChartDataPoint | undefined;
              if (
                !pl?.type ||
                pl.type === "now" ||
                cx === null ||
                cx === undefined ||
                cy === null ||
                cy === undefined
              )
                return <React.Fragment key={`pd-${cx}`} />;
              const color = pl.type === "ath" ? "#22c55e" : "#ef4444";
              const r = pl.matchLevel === "full" ? 7 : 5;
              return (
                <circle
                  key={`pd-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
