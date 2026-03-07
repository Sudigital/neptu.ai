import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { useTranslate } from "@/hooks/use-translate";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import {
  getProsperity,
  getProsperityPeriods,
  PROSPERITY_LEVELS,
  getPersonality,
} from "@neptu/shared";
import { TrendingUp, User } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts";

type ProsperityLevel = keyof typeof PROSPERITY_LEVELS;

interface ProsperityPersonalityPanelProps {
  totalUrip: number;
  birthDate: string;
}

function calculateAge(birthDate: string): number | null {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const LEVEL_STYLES: Record<
  number,
  { bg: string; text: string; border: string; bar: string }
> = {
  0: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    bar: "bg-red-500",
  },
  1: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    bar: "bg-orange-500",
  },
  2: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    bar: "bg-yellow-500",
  },
  3: {
    bg: "bg-lime-50 dark:bg-lime-950/30",
    text: "text-lime-700 dark:text-lime-400",
    border: "border-lime-200 dark:border-lime-800",
    bar: "bg-lime-500",
  },
  4: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    bar: "bg-green-500",
  },
  5: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    bar: "bg-emerald-500",
  },
  7: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    bar: "bg-blue-500",
  },
  8: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
    bar: "bg-violet-500",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-muted",
  text: "text-muted-foreground",
  border: "border-border",
  bar: "bg-muted-foreground",
};

const LEVEL_COLORS: Record<number, string> = {
  0: "#ef4444",
  1: "#f97316",
  2: "#eab308",
  3: "#84cc16",
  4: "#22c55e",
  5: "#10b981",
  7: "#3b82f6",
  8: "#8b5cf6",
};

const DEFAULT_DOT_COLOR = "#a1a1aa";

const MAX_LEVEL = 8;

const prosperityChartConfig = {
  level: { label: "Level", color: "oklch(0.828 0.189 84.429)" },
} satisfies ChartConfig;

export function ProsperityPersonalityPanel({
  totalUrip,
  birthDate,
}: ProsperityPersonalityPanelProps) {
  const t = useTranslate();
  const { language } = useSettingsStore();
  const lang = language || "en";

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);

  const currentProsperity = useMemo(
    () => (age !== null ? getProsperity(totalUrip, age) : null),
    [totalUrip, age]
  );

  const periods = useMemo(() => getProsperityPeriods(totalUrip), [totalUrip]);

  const watak = useMemo(() => getPersonality(totalUrip), [totalUrip]);

  const chartData = useMemo(
    () =>
      periods
        ? periods.map((p) => {
            const levelData = PROSPERITY_LEVELS[p.level as ProsperityLevel];
            const desc = levelData
              ? ((levelData as Record<string, string>)[lang] ?? levelData.en)
              : "";
            return {
              age: `${p.fromAge}-${p.toAge}`,
              level: p.level,
              fromAge: p.fromAge,
              toAge: p.toAge,
              description: desc,
              color: LEVEL_COLORS[p.level] ?? DEFAULT_DOT_COLOR,
            };
          })
        : [],
    [periods, lang]
  );

  const currentPeriodIndex = useMemo(
    () =>
      age !== null && periods
        ? periods.findIndex((p) => age >= p.fromAge && age <= p.toAge)
        : -1,
    [age, periods]
  );

  const gradientStops = useMemo(() => {
    if (chartData.length < 2) return [];
    const lastIdx = chartData.length - 1;
    return chartData.map((d, i) => ({
      offset: `${(i / lastIdx) * 100}%`,
      color: d.color,
    }));
  }, [chartData]);

  const hasProsperity = periods !== null && periods.length > 0;
  if (!hasProsperity && !watak) return null;

  const currentDesc = currentProsperity
    ? ((currentProsperity.descriptions as Record<string, string>)[lang] ??
      currentProsperity.descriptions.en)
    : null;

  const watakDesc = watak
    ? ((watak.descriptions as Record<string, string>)[lang] ??
      watak.descriptions.en)
    : null;

  const currentStyle = currentProsperity
    ? (LEVEL_STYLES[currentProsperity.level] ?? DEFAULT_STYLE)
    : DEFAULT_STYLE;

  // Find next period for transition info
  const nextPeriod =
    age !== null && periods ? periods.find((p) => p.fromAge > age) : null;

  const nextPeriodDesc = nextPeriod
    ? (PROSPERITY_LEVELS[nextPeriod.level as ProsperityLevel] ?? null)
    : null;

  const nextDesc = nextPeriodDesc
    ? ((nextPeriodDesc as Record<string, string>)[lang] ?? nextPeriodDesc.en)
    : null;

  return (
    <>
      <Separator className="my-4" />

      {/* Prosperity Section — 2 column: chart + table */}
      {hasProsperity && periods && periods.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="text-xs font-semibold">
              {t("oracle.prosperity", "Prosperity Forecast")}
            </h4>
          </div>

          {/* Current Level — only if age is within covered range */}
          {currentProsperity && age !== null && currentDesc && (
            <div
              className={cn(
                "rounded-lg border p-3",
                currentStyle.bg,
                currentStyle.border
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t("oracle.currentPhase", "Current phase")} (
                  {t("oracle.age", "age")} {age})
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    currentStyle.bg,
                    currentStyle.text
                  )}
                >
                  {t("oracle.level", "Level")} {currentProsperity.level}
                </span>
              </div>
              <p className={cn("mt-1 text-sm font-medium", currentStyle.text)}>
                {currentDesc}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentStyle.bar
                  )}
                  style={{
                    width: `${(currentProsperity.level / MAX_LEVEL) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Next period preview */}
          {nextPeriod && nextDesc && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2">
              <span className="text-[10px] text-muted-foreground">
                {t("oracle.nextPhase", "Next")} ({t("oracle.age", "age")}{" "}
                {nextPeriod.fromAge}–{nextPeriod.toAge}):
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  (LEVEL_STYLES[nextPeriod.level] ?? DEFAULT_STYLE).text
                )}
              >
                {t("oracle.level", "Level")} {nextPeriod.level} — {nextDesc}
              </span>
            </div>
          )}

          {/* 2-column: Bar Chart + Table */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Left — Line Chart */}
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-[10px] font-semibold text-muted-foreground">
                {t("oracle.lifetimeTimeline", "Lifetime prosperity timeline")}
              </p>
              <ChartContainer
                config={prosperityChartConfig}
                className="!aspect-auto h-[160px] w-full min-w-0"
              >
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="age"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    fontSize={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={2}
                    domain={[0, MAX_LEVEL]}
                    ticks={[0, 2, 4, 6, MAX_LEVEL]}
                    fontSize={10}
                    width={24}
                  />
                  {currentPeriodIndex >= 0 &&
                    chartData[currentPeriodIndex] !== undefined && (
                      <ReferenceDot
                        x={chartData[currentPeriodIndex].age}
                        y={chartData[currentPeriodIndex].level}
                        r={6}
                        fill={chartData[currentPeriodIndex].color}
                        stroke="var(--background)"
                        strokeWidth={2}
                        ifOverflow="visible"
                      />
                    )}
                  <defs>
                    <linearGradient
                      id="prosperityLineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      {gradientStops.map((stop, i) => (
                        <stop
                          key={`${stop.offset}-${i}`}
                          offset={stop.offset}
                          stopColor={stop.color}
                        />
                      ))}
                    </linearGradient>
                  </defs>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, _name, props) => {
                          const entry = props.payload as Record<
                            string,
                            unknown
                          >;
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {t("oracle.age", "age")}{" "}
                                  {String(entry.fromAge)}-{String(entry.toAge)}
                                </span>
                                <span className="font-bold">
                                  {t("oracle.level", "Level")} {String(value)}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {String(entry.description)}
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Line
                    dataKey="level"
                    type="monotone"
                    stroke="url(#prosperityLineGradient)"
                    strokeWidth={2}
                    dot={(dotProps: Record<string, unknown>) => {
                      const { cx, cy, payload, key } = dotProps as {
                        cx: number;
                        cy: number;
                        payload: { color: string };
                        key: string;
                      };
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={payload.color}
                          stroke="var(--background)"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                    activeDot={(dotProps: unknown) => {
                      const { cx, cy, payload, key } = dotProps as {
                        cx: number;
                        cy: number;
                        payload: { color: string };
                        key: string;
                      };
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={payload.color}
                          stroke="var(--background)"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Right — Table all periods */}
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">
                      {t("oracle.ageRange", "Age")}
                    </th>
                    <th className="px-2 py-1.5 text-center font-semibold text-muted-foreground">
                      {t("oracle.level", "Level")}
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">
                      {t("oracle.description", "Description")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...periods].reverse().map((p) => {
                    const isCurrent =
                      age !== null && age >= p.fromAge && age <= p.toAge;
                    const style = LEVEL_STYLES[p.level] ?? DEFAULT_STYLE;
                    const levelData =
                      PROSPERITY_LEVELS[p.level as ProsperityLevel];
                    const desc = levelData
                      ? ((levelData as Record<string, string>)[lang] ??
                        levelData.en)
                      : "—";
                    return (
                      <tr
                        key={p.fromAge}
                        className={cn(
                          "border-b transition-colors last:border-b-0",
                          isCurrent
                            ? cn(style.bg, "font-medium")
                            : "hover:bg-muted/30"
                        )}
                      >
                        <td className="px-2 py-1.5 tabular-nums">
                          {p.fromAge}–{p.toAge}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span
                            className={cn(
                              "inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
                              style.bar
                            )}
                          >
                            {p.level}
                          </span>
                        </td>
                        <td
                          className={cn("px-2 py-1.5", isCurrent && style.text)}
                        >
                          {desc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Personality Section */}
      {watak && watakDesc && (
        <>
          {hasProsperity && <Separator className="my-4" />}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-xs font-semibold">
                {t("oracle.personality", "Personality Traits")}
              </h4>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                {t("oracle.watak", "Watak")} {watak.watak}
              </span>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
              <p className="text-xs leading-relaxed text-indigo-900 dark:text-indigo-200">
                {watakDesc}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
