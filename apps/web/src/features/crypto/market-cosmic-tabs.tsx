import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar,
  Sparkles,
  Gift,
  Cake,
  Clock,
  BarChart3,
  Coins,
} from "lucide-react";
import { PieChart, Pie, Cell, Sector } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import {
  type CryptoWithMarketData,
  formatCurrency,
  formatFullDate,
  formatNumber,
  formatPercentage,
  getAge,
  getAgeInDays,
  getDaysUntilBirthday,
  isBirthdayToday,
} from "./crypto-utils";

export function BirthdayTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();
  const age = getAge(crypto.birthday);
  const ageInDays = getAgeInDays(crypto.birthday);
  const isBirthday = isBirthdayToday(crypto.birthday);
  const daysUntilBirthday = getDaysUntilBirthday(crypto.birthday);

  return (
    <>
      {/* Age & Countdown - 2 column */}
      <div
        className={`grid ${isBirthday ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-4 items-stretch`}
      >
        {/* Age Display (Left) */}
        <Card
          className={isBirthday ? "border-primary ring-2 ring-primary/20" : ""}
        >
          <CardContent className="text-center">
            {isBirthday && (
              <div className="mb-4 text-4xl animate-bounce">🎂</div>
            )}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Cake className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">
                {isBirthday
                  ? t("crypto.birthday.happyBirthday")
                  : t("crypto.birthday.age")}
              </h4>
            </div>
            <p className="text-5xl font-bold text-primary mb-2">{age}</p>
            <p className="text-muted-foreground">
              {t("crypto.birthday.yearsOld")} • {ageInDays.toLocaleString()}{" "}
              {t("crypto.birthday.days")}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Calendar className="h-3 w-3 inline mr-1" />
              {t("crypto.birthday.born")} {formatFullDate(crypto.birthday)}
            </p>
          </CardContent>
        </Card>

        {/* Birthday Countdown (Right) */}
        {!isBirthday && (
          <BirthdayCountdownCard
            daysUntilBirthday={daysUntilBirthday}
            birthday={crypto.birthday}
          />
        )}
      </div>

      {/* Cosmic Birthday Info */}
      {crypto.cosmicAlignment && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">
                {t("crypto.birthday.cosmicProfile")}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.dayName")}
                </p>
                <p className="font-semibold">
                  {crypto.cosmicAlignment.dayName}
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.wuku")}
                </p>
                <p className="font-semibold">{crypto.cosmicAlignment.wuku}</p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.pancaWara")}
                </p>
                <p className="font-semibold">
                  {crypto.cosmicAlignment.pancaWara}
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.saptaWara")}
                </p>
                <p className="font-semibold">
                  {crypto.cosmicAlignment.saptaWara}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-primary/5">
              <p className="text-sm italic text-muted-foreground">
                "{crypto.cosmicAlignment.cosmicMessage}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function BirthdayCountdownCard({
  daysUntilBirthday,
  birthday,
}: {
  daysUntilBirthday: number;
  birthday: string;
}) {
  const t = useTranslate();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function calcTimeLeft() {
      const now = new Date();
      const bDate = new Date(birthday);
      const nextBday = new Date(
        now.getFullYear(),
        bDate.getMonth(),
        bDate.getDate(),
      );
      if (nextBday <= now) nextBday.setFullYear(nextBday.getFullYear() + 1);
      const diff = nextBday.getTime() - now.getTime();
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    }
    calcTimeLeft();
    const interval = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [birthday]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card className="h-full">
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">
            {t("crypto.birthday.countdown")}
          </h4>
        </div>
        <div className="flex items-center justify-center gap-1 mt-3 font-mono text-2xl font-bold text-primary/80">
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {daysUntilBirthday}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              {t("crypto.birthday.days")}
            </span>
          </div>
          <span className="animate-pulse mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              hrs
            </span>
          </div>
          <span className="animate-pulse mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              min
            </span>
          </div>
          <span className="animate-pulse mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {pad(timeLeft.seconds)}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              sec
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SUPPLY_COLORS = ["#22c55e", "#334155"];
const COSMIC_COLORS = ["#a855f7", "#1e293b"];

function useMouseTooltip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 12 });
  }, []);
  const onMouseLeave = useCallback(() => setMouse(null), []);
  return { containerRef, mouse, onMouseMove, onMouseLeave };
}

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

function renderActiveShape(props: ActiveShapeProps) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

function SupplyDonutChart({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const {
    containerRef,
    mouse,
    onMouseMove,
    onMouseLeave: onContainerLeave,
  } = useMouseTooltip();

  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const circulating = crypto.circulatingSupply ?? 0;
  // Use maxSupply as denominator when available (e.g. BTC 19.82M / 21M),
  // otherwise fall back to totalSupply
  const denominator = crypto.maxSupply ?? crypto.totalSupply ?? 0;
  const remaining = Math.max(denominator - circulating, 0);
  const ratio =
    denominator > 0 ? ((circulating / denominator) * 100).toFixed(1) : "0";

  const data = [
    { name: t("crypto.market.circulating"), value: circulating },
    {
      name: t("crypto.market.remaining"),
      value: remaining > 0 ? remaining : 0.001,
    },
  ];

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">{t("crypto.market.supply")}</h4>
        </div>

        {denominator > 0 ? (
          <div className="flex flex-col items-center">
            <div
              ref={containerRef}
              className="relative inline-flex items-center justify-center w-48 h-48"
              onMouseMove={onMouseMove}
              onMouseLeave={() => {
                onContainerLeave();
                onPieLeave();
              }}
            >
              <div className="absolute inset-0">
                <PieChart
                  width={192}
                  height={192}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <Pie
                    data={data}
                    cx={96}
                    cy={96}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    activeShape={
                      renderActiveShape as unknown as (
                        props: unknown,
                      ) => React.JSX.Element
                    }
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    strokeWidth={0}
                    {...({ activeIndex } as Record<string, unknown>)}
                  >
                    {data.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUPPLY_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="relative text-2xl font-bold">
                  {ratio}
                  <span className="absolute -right-4 top-0 text-xs font-medium text-muted-foreground">
                    %
                  </span>
                </span>
              </div>
              {activeIndex !== undefined && mouse && (
                <div
                  className="absolute z-50 rounded-lg border bg-popover px-3 py-2 text-sm shadow-md pointer-events-none text-left whitespace-nowrap"
                  style={{ left: mouse.x, top: mouse.y }}
                >
                  <p className="font-medium">{data[activeIndex].name}</p>
                  <p className="text-muted-foreground">
                    {formatNumber(data[activeIndex].value)}
                  </p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="w-full mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: SUPPLY_COLORS[0] }}
                  />
                  <span className="text-muted-foreground">
                    {t("crypto.market.circulating")}
                  </span>
                </div>
                <span className="font-medium">{formatNumber(circulating)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: SUPPLY_COLORS[1] }}
                  />
                  <span className="text-muted-foreground">
                    {crypto.maxSupply
                      ? t("crypto.market.max")
                      : t("crypto.market.total")}
                  </span>
                </div>
                <span className="font-medium">{formatNumber(denominator)}</span>
              </div>
              {crypto.maxSupply &&
                crypto.totalSupply &&
                crypto.totalSupply !== crypto.maxSupply && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                      <span className="text-muted-foreground">
                        {t("crypto.market.total")}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(crypto.totalSupply)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("crypto.market.circulating")}
              </span>
              <span className="font-medium">{formatNumber(circulating)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("crypto.market.max")}
              </span>
              <span className="font-medium">
                {crypto.maxSupply ? formatNumber(crypto.maxSupply) : "∞"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CosmicScoreDonut({ alignmentScore }: { alignmentScore: number }) {
  const t = useTranslate();
  const { containerRef, mouse, onMouseMove, onMouseLeave } = useMouseTooltip();
  const [hovered, setHovered] = useState(false);

  const cosmicData = [
    { name: t("crypto.cosmic.alignmentScore"), value: alignmentScore },
    { name: "", value: 100 - alignmentScore },
  ];

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center justify-center w-48 h-48"
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        onMouseLeave();
        setHovered(false);
      }}
    >
      <div className="absolute inset-0">
        <PieChart
          width={192}
          height={192}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <Pie
            data={cosmicData}
            cx={96}
            cy={96}
            innerRadius={55}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
            onMouseEnter={(_: unknown, index: number) =>
              setHovered(index === 0)
            }
            onMouseLeave={() => setHovered(false)}
          >
            <Cell fill={COSMIC_COLORS[0]} />
            <Cell fill={COSMIC_COLORS[1]} />
          </Pie>
        </PieChart>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="relative text-3xl font-bold text-primary">
          {alignmentScore}
          <span className="absolute -right-4 top-0 text-xs font-medium text-primary/70">
            %
          </span>
        </span>
      </div>
      {hovered && mouse && (
        <div
          className="absolute z-50 rounded-lg border bg-popover px-3 py-2 text-sm shadow-md pointer-events-none text-left whitespace-nowrap"
          style={{ left: mouse.x, top: mouse.y }}
        >
          <p className="font-medium">{t("crypto.cosmic.alignmentScore")}</p>
          <p className="text-muted-foreground">{alignmentScore}%</p>
        </div>
      )}
    </div>
  );
}

export function MarketTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();

  return (
    <>
      {/* Supply Info - Donut Chart */}
      <SupplyDonutChart crypto={crypto} />

      {/* Volume & Activity */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">
              {t("crypto.market.activity")}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                {t("crypto.market.24hVolume")}
              </p>
              <p className="text-lg font-bold">
                {formatCurrency(crypto.totalVolume)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                {t("crypto.market.24hChange")}
              </p>
              <p
                className={`text-lg font-bold ${(crypto.priceChangePercentage24h ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatPercentage(crypto.priceChangePercentage24h)}
              </p>
            </div>
          </div>
          {crypto.lastUpdated && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("crypto.market.lastUpdated")}:{" "}
              {new Date(crypto.lastUpdated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function CosmicTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();

  if (!crypto.cosmicAlignment) {
    return (
      <Card>
        <CardContent className="text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t("crypto.cosmic.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  const { alignmentScore, cosmicMessage, dayName, pancaWara, saptaWara, wuku } =
    crypto.cosmicAlignment;

  return (
    <>
      {/* Alignment Score - Donut */}
      <Card className="border-primary/50">
        <CardContent className="text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-lg mb-2">
            {t("crypto.cosmic.alignmentScore")}
          </h4>
          <CosmicScoreDonut alignmentScore={alignmentScore} />
          <p className="mt-3 text-sm italic text-muted-foreground">
            "{cosmicMessage}"
          </p>
        </CardContent>
      </Card>

      {/* Wuku Cycle */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">
              {t("crypto.cosmic.wukuCycle")}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.dayName")}
              </p>
              <p className="text-xl font-bold text-primary">{dayName}</p>
            </div>
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.wuku")}
              </p>
              <p className="text-xl font-bold text-primary">{wuku}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panca & Sapta Wara */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">
              {t("crypto.cosmic.waraSystem")}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-amber-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.pancaWara")}
              </p>
              <p className="text-lg font-bold text-amber-600">{pancaWara}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("crypto.cosmic.fiveDayCycle")}
              </p>
            </div>
            <div className="rounded-lg bg-violet-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.saptaWara")}
              </p>
              <p className="text-lg font-bold text-violet-600">{saptaWara}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("crypto.cosmic.sevenDayCycle")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
