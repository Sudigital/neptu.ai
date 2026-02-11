import React from "react";
import { isToday, getHours } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/* ── Shared types ────────────────────────────────────── */

export type ReadingLike =
  | {
      cipta?: { value: number; name: string };
      rasa?: { value: number; name: string };
      karsa?: { value: number; name: string };
      tindakan?: { value: number; name: string };
      frekuensi?: { value: number; name: string };
      dualitas?: string;
      afirmasi?: { name: string };
    }
  | undefined;

/* ── Energy helpers ──────────────────────────────────── */

function getHourEnergy(
  hour: number,
  totalUrip: number,
): "high" | "mid" | "low" {
  const seed = (totalUrip * 7 + hour * 13) % 24;
  if (seed < 8) return "high";
  if (seed < 16) return "mid";
  return "low";
}

function getEnergyPercent(level: "high" | "mid" | "low"): number {
  return level === "high" ? 100 : level === "mid" ? 66 : 33;
}

/* ── 24h Energy Step Chart ───────────────────────────── */

const energyChartConfig = {
  energy: { label: "Energy %", color: "oklch(0.765 0.177 163)" },
} satisfies ChartConfig;

export function HourlyGrid({
  selectedDate,
  peluang,
}: {
  selectedDate: Date;
  peluang: { total_urip?: number; c24_urip?: number } | undefined;
}) {
  const t = useTranslate();
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    if (!isToday(selectedDate)) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [selectedDate]);
  const currentHour = isToday(selectedDate) ? getHours(now) : -1;
  const nowLabel = isToday(selectedDate)
    ? now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;
  const totalUrip = peluang?.total_urip ?? 0;

  const chartData = Array.from({ length: 24 }, (_, i) => {
    const level = getHourEnergy(i, totalUrip);
    return {
      hour: String(i + 1).padStart(2, "0"),
      energy: getEnergyPercent(level),
      level,
    };
  });

  const currentEnergy =
    currentHour >= 0 ? getHourEnergy(currentHour, totalUrip) : null;
  const energyLabel =
    currentEnergy === "high"
      ? t("chart.good")
      : currentEnergy === "mid"
        ? t("chart.neutral")
        : t("chart.caution");
  const energyTextColor =
    currentEnergy === "high"
      ? "text-emerald-600 dark:text-emerald-400"
      : currentEnergy === "mid"
        ? "text-sky-600 dark:text-sky-400"
        : "text-rose-600 dark:text-rose-400";
  const energyFillColor =
    currentEnergy === "high"
      ? "oklch(0.765 0.177 163)"
      : currentEnergy === "mid"
        ? "oklch(0.685 0.169 237)"
        : "oklch(0.712 0.194 13)";

  return (
    <div className="space-y-3">
      <ChartContainer
        config={energyChartConfig}
        className="!aspect-auto h-[180px] sm:h-[220px] w-full min-w-0"
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            interval={"equidistantPreserveStart"}
            fontSize={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={2}
            domain={[0, 100]}
            ticks={[0, 33, 66, 100]}
            tickFormatter={(v) => `${v}%`}
            fontSize={10}
            width={36}
          />
          {currentHour >= 0 && (
            <ReferenceLine
              segment={[
                {
                  x: String(currentHour + 1).padStart(2, "0"),
                  y: 0,
                },
                {
                  x: String(currentHour + 1).padStart(2, "0"),
                  y: 100,
                },
              ]}
              ifOverflow="visible"
              stroke="oklch(0.606 0.25 292.72)"
              strokeDasharray="4 3"
              strokeWidth={2}
            />
          )}
          {currentHour >= 0 && currentEnergy && (
            <ReferenceDot
              x={String(currentHour + 1).padStart(2, "0")}
              y={
                currentEnergy === "high"
                  ? 100
                  : currentEnergy === "mid"
                    ? 66
                    : 33
              }
              r={5}
              fill={energyFillColor}
              stroke="var(--background)"
              strokeWidth={2}
              ifOverflow="visible"
            />
          )}
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, props) => {
                  const lvl = props.payload.level as string;
                  const label =
                    lvl === "high"
                      ? t("chart.good")
                      : lvl === "mid"
                        ? t("chart.neutral")
                        : t("chart.caution");
                  return (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {t("chart.hour")} {props.payload.hour}
                      </span>
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-bold">{String(value)}%</span>
                    </div>
                  );
                }}
              />
            }
          />
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.765 0.177 163)" />
              <stop offset="50%" stopColor="oklch(0.685 0.169 237)" />
              <stop offset="100%" stopColor="oklch(0.712 0.194 13)" />
            </linearGradient>
          </defs>
          <Line
            dataKey="energy"
            type="step"
            stroke="url(#energyGradient)"
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ChartContainer>

      {/* Current hour + Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
        {currentHour >= 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-muted-foreground">{t("chart.now")}:</span>
            <span className="font-semibold tabular-nums">{nowLabel}</span>
            <span className="text-muted-foreground">—</span>
            <span className={cn("font-medium", energyTextColor)}>
              {energyLabel} {t("chart.energy")}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground sm:ml-auto">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t("chart.good")} (100%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {t("chart.neutral")} (66%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {t("chart.caution")} (33%)
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Soul Dimensions Radar Chart ─────────────────────── */

const radarChartConfig = {
  peluang: { label: "Peluang (Today)", color: "oklch(0.685 0.169 237)" },
  potensi: { label: "Potensi (Birth)", color: "oklch(0.769 0.188 70.08)" },
} satisfies ChartConfig;

export function SoulRadarChart({
  peluang,
  potensi,
}: {
  peluang: ReadingLike;
  potensi: ReadingLike;
}) {
  const t = useTranslate();
  const dimensions = [
    "cipta",
    "rasa",
    "karsa",
    "tindakan",
    "frekuensi",
  ] as const;
  const labels: Record<string, string> = {
    cipta: t("chart.cipta"),
    rasa: t("chart.rasa"),
    karsa: t("chart.karsa"),
    tindakan: t("chart.tindakan"),
    frekuensi: t("chart.frekuensi"),
  };

  const data = dimensions.map((dim) => ({
    dimension: labels[dim],
    peluang: peluang?.[dim]?.value ?? 0,
    potensi: potensi?.[dim]?.value ?? 0,
  }));

  return (
    <div className="flex-1 flex flex-col space-y-2">
      <ChartContainer
        config={radarChartConfig}
        className="!aspect-auto mx-auto h-[200px] sm:h-[240px] w-full min-w-0"
      >
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Radar
            name="Peluang"
            dataKey="peluang"
            stroke="oklch(0.685 0.169 237)"
            fill="oklch(0.685 0.169 237)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Potensi"
            dataKey="potensi"
            stroke="oklch(0.769 0.188 70.08)"
            fill="oklch(0.769 0.188 70.08)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ChartContainer>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          {t("chart.peluang")} ({t("chart.today")})
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {t("chart.potensi")} ({t("chart.birth")})
        </span>
      </div>

      {/* Soul Summary Card */}
      <Card className="flex-1 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 p-3">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2">
          {t("chart.soulProfile")}
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          {dimensions.map((dim) => {
            const pVal = peluang?.[dim]?.value ?? 0;
            const bVal = potensi?.[dim]?.value ?? 0;
            return (
              <div key={dim} className="flex items-center justify-between">
                <span className="text-muted-foreground">{labels[dim]}</span>
                <span className="font-semibold tabular-nums">
                  {pVal}
                  {bVal !== pVal && (
                    <span
                      className={cn(
                        "ml-1 text-[10px]",
                        pVal > bVal ? "text-emerald-600" : "text-rose-500",
                      )}
                    >
                      {pVal > bVal ? "↑" : "↓"}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          <div className="col-span-2 mt-1 flex items-center gap-1.5">
            <span className="text-muted-foreground">
              {t("dashboard.dualitas")}:
            </span>
            <span className="font-semibold">{peluang?.dualitas ?? "-"}</span>
            {peluang?.afirmasi?.name && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground truncate">
                  {peluang.afirmasi.name}
                </span>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
