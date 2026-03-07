import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Loader2, TrendingUp } from "lucide-react";

import type { CryptoMarketCoin } from "./world-economic-parts";

import { formatCoinPrice, formatCompactCurrency } from "./world-economic-parts";

/* ── Constants ───────────────────────────────────────── */

const POSITIVE_THRESHOLD = 0;

/* ── Helpers ─────────────────────────────────────────── */

function computeMarketSummary(coins: CryptoMarketCoin[]) {
  let totalMarketCap = 0;
  let btcMarketCap = 0;
  let totalVolume = 0;
  let winners = 0;
  let losers = 0;

  for (const coin of coins) {
    const mc = coin.marketCap ?? 0;
    totalMarketCap += mc;
    totalVolume += coin.totalVolume ?? 0;
    if (coin.symbol === "BTC") btcMarketCap = mc;
    if ((coin.priceChangePercentage24h ?? 0) > POSITIVE_THRESHOLD) winners++;
    else losers++;
  }

  const btcDominance =
    totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 0;

  return { totalMarketCap, btcDominance, totalVolume, winners, losers };
}

/* ── Coin Card ───────────────────────────────────────── */

function CoinCard({ coin }: { coin: CryptoMarketCoin }) {
  const change = coin.priceChangePercentage24h ?? 0;
  const isPositive = change > POSITIVE_THRESHOLD;
  const Arrow = isPositive ? ArrowUp : ArrowDown;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-muted/50">
      {coin.image ? (
        <img
          src={coin.image}
          alt={coin.symbol}
          className="h-7 w-7 shrink-0 rounded-full"
        />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
          {coin.symbol.slice(0, 2)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold">{coin.symbol}</span>
          <span className="truncate text-xs font-medium tabular-nums">
            {coin.currentPrice !== null
              ? formatCoinPrice(coin.currentPrice)
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[10px] text-muted-foreground">
            {coin.name}
          </span>
          <span
            className={cn(
              "flex items-center gap-0.5 text-[10px] font-semibold tabular-nums",
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            <Arrow className="h-2.5 w-2.5" />
            {Math.abs(change).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Summary Stat ────────────────────────────────────── */

function SummaryStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-bold tabular-nums">{value}</div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */

export function CryptoMarketGrid({
  coins,
  isLoading,
}: {
  coins: CryptoMarketCoin[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading market data...
        </CardContent>
      </Card>
    );
  }

  if (coins.length === 0) return null;

  const summary = computeMarketSummary(coins);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-sm">Crypto Market Overview</CardTitle>
              <CardDescription className="text-xs">
                {coins.length} tracked coins · Updated every 10 min
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-4">
            <SummaryStat
              label="BTC Dominance"
              value={`${summary.btcDominance.toFixed(1)}%`}
            />
            <SummaryStat
              label="Total Volume"
              value={formatCompactCurrency(summary.totalVolume)}
            />
            <SummaryStat
              label="Market Cap"
              value={formatCompactCurrency(summary.totalMarketCap)}
            />
            <SummaryStat
              label="24h W/L"
              value={`${summary.winners}/${summary.losers}`}
              className="hidden sm:block"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
          {coins.map((coin) => (
            <CoinCard key={coin.symbol} coin={coin} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
