import type { PersonDTO } from "@neptu/drizzle-orm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProsperityPeriods } from "@neptu/shared";

import type { MarketSentiment } from "./world-economic-parts";

import {
  calculateAge,
  getProsperityWithFallback,
  getTotalUrip,
  LEVEL_COLORS,
  SENTIMENT_ZONES,
} from "./world-economic-parts";

/* ── Constants ───────────────────────────────────────── */

const GAUGE_CENTER_X = 100;
const GAUGE_CENTER_Y = 100;
const GAUGE_RADIUS = 80;
const GAUGE_NEEDLE_LEN = 70;
const FULL_SCORE = 100;

/* ── Prosperity Card ─────────────────────────────────── */

export function ProsperityCard({
  figure,
  color,
}: {
  figure: PersonDTO;
  color: string;
}) {
  const totalUrip = getTotalUrip(figure);
  const age = calculateAge(figure.birthday);

  if (totalUrip === null || age === null) return null;

  const current = getProsperityWithFallback(totalUrip, age);
  const periods = getProsperityPeriods(totalUrip);

  if (!current || !periods || periods.length === 0) return null;

  const currentDesc = (current.descriptions as Record<string, string>).en;
  const levelColor = LEVEL_COLORS[current.level] ?? "#6b7280";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <CardTitle className="text-sm">{figure.name}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Urip {totalUrip} · Age {age} · Born {figure.birthday}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: levelColor }}
          >
            {current.level}
          </span>
          <span className="text-xs">{currentDesc}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Market Sentiment Gauge ──────────────────────────── */

export function MarketSentimentGauge({
  sentiment,
  isFiltered = false,
  totalCount,
}: {
  sentiment: MarketSentiment;
  isFiltered?: boolean;
  totalCount?: number;
}) {
  const needleAngle = Math.PI - (sentiment.score / FULL_SCORE) * Math.PI;
  const nx = GAUGE_CENTER_X + GAUGE_NEEDLE_LEN * Math.cos(needleAngle);
  const ny = GAUGE_CENTER_Y - GAUGE_NEEDLE_LEN * Math.sin(needleAngle);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Neptu Market Sentiment Index</CardTitle>
        <CardDescription className="text-xs">
          {isFiltered ? (
            <>
              Based on{" "}
              <span className="font-semibold text-primary">
                {sentiment.figureCount} selected
              </span>{" "}
              of {totalCount ?? sentiment.figureCount}{" "}
              {(totalCount ?? sentiment.figureCount) === 1
                ? "person"
                : "people"}
            </>
          ) : (
            <>
              Based on {sentiment.figureCount} powerful{" "}
              {sentiment.figureCount === 1 ? "person" : "people"}
            </>
          )}
          {sentiment.pairCount > 0 &&
            ` · ${sentiment.pairCount} compatibility ${
              sentiment.pairCount === 1 ? "pair" : "pairs"
            }`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 120" className="w-full max-w-[240px]">
            {SENTIMENT_ZONES.map((zone) => {
              const segStart = Math.PI - (zone.min / FULL_SCORE) * Math.PI;
              const segEnd = Math.PI - (zone.max / FULL_SCORE) * Math.PI;
              const x1 = GAUGE_CENTER_X + GAUGE_RADIUS * Math.cos(segStart);
              const y1 = GAUGE_CENTER_Y - GAUGE_RADIUS * Math.sin(segStart);
              const x2 = GAUGE_CENTER_X + GAUGE_RADIUS * Math.cos(segEnd);
              const y2 = GAUGE_CENTER_Y - GAUGE_RADIUS * Math.sin(segEnd);
              return (
                <path
                  key={zone.label}
                  d={`M ${x1} ${y1} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={zone.color}
                  strokeWidth={12}
                  strokeLinecap="butt"
                />
              );
            })}
            <line
              x1={GAUGE_CENTER_X}
              y1={GAUGE_CENTER_Y}
              x2={nx}
              y2={ny}
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <circle
              cx={GAUGE_CENTER_X}
              cy={GAUGE_CENTER_Y}
              r={4}
              fill="currentColor"
            />
          </svg>

          <div className="mt-1 text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: sentiment.zone.color }}
            >
              {sentiment.score}
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: sentiment.zone.color }}
            >
              {sentiment.zone.label}
            </div>
          </div>

          <div className="mt-3 grid w-full grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-md border px-2 py-1.5 text-center">
              <div className="text-muted-foreground">Prosperity</div>
              <div className="font-bold">{sentiment.avgProsperity}%</div>
            </div>
            <div className="rounded-md border px-2 py-1.5 text-center">
              <div className="text-muted-foreground">Daily Energy</div>
              <div className="font-bold">{sentiment.avgDailyEnergy}%</div>
            </div>
            <div className="rounded-md border px-2 py-1.5 text-center">
              <div className="text-muted-foreground">Urip Peluang</div>
              <div className="font-bold">{sentiment.avgUripPeluang}%</div>
            </div>
            {sentiment.pairCount > 0 && (
              <div className="rounded-md border px-2 py-1.5 text-center">
                <div className="text-muted-foreground">Compatibility</div>
                <div className="font-bold">{sentiment.avgCompatibility}%</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
