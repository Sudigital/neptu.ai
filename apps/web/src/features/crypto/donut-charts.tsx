import { Card, CardContent } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import { Coins } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { PieChart, Pie, Cell, Sector } from "recharts";

import { type CryptoWithMarketData, formatNumber } from "./crypto-utils";

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

export function SupplyDonutChart({ crypto }: { crypto: CryptoWithMarketData }) {
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
        <div className="mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <h4 className="text-lg font-semibold">{t("crypto.market.supply")}</h4>
        </div>

        {denominator > 0 ? (
          <div className="flex flex-col items-center">
            <div
              ref={containerRef}
              className="relative inline-flex h-48 w-48 items-center justify-center"
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
                        props: unknown
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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="relative text-2xl font-bold">
                  {ratio}
                  <span className="absolute top-0 -right-4 text-xs font-medium text-muted-foreground">
                    %
                  </span>
                </span>
              </div>
              {activeIndex !== undefined && mouse && (
                <div
                  className="pointer-events-none absolute z-50 rounded-lg border bg-popover px-3 py-2 text-left text-sm whitespace-nowrap shadow-md"
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
            <div className="mt-4 w-full space-y-2">
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

export function CosmicScoreDonut({
  alignmentScore,
}: {
  alignmentScore: number;
}) {
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
      className="relative inline-flex h-48 w-48 items-center justify-center"
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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="relative text-3xl font-bold text-primary">
          {alignmentScore}
          <span className="absolute top-0 -right-4 text-xs font-medium text-primary/70">
            %
          </span>
        </span>
      </div>
      {hovered && mouse && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border bg-popover px-3 py-2 text-left text-sm whitespace-nowrap shadow-md"
          style={{ left: mouse.x, top: mouse.y }}
        >
          <p className="font-medium">{t("crypto.cosmic.alignmentScore")}</p>
          <p className="text-muted-foreground">{alignmentScore}%</p>
        </div>
      )}
    </div>
  );
}
