import type { MarketAsset } from "@neptu/shared";

import { Badge } from "@/components/ui/badge";
import {
  EXCHANGE_LISTINGS,
  EXCHANGE_TYPE_COLORS,
  EXCHANGE_TYPE_LABELS,
  TOP_CRYPTO_COINS,
  TOPIC_TO_CRYPTO_MAP,
} from "@neptu/shared";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDown,
  BarChart3,
  Table2,
  TrendingUp,
} from "lucide-react";

import type { Interpretation } from "./market-chart-parts";
import type {
  FearGreedResponse,
  FundingRateResult,
  OpenInterestResult,
} from "./market-chart-parts";
import type {
  ChartPoint,
  CoinGeckoChartResponse,
} from "./world-economic-parts";

import {
  FearGreedContent,
  getFgZone,
  interpretFunding,
  MarketSignalCard,
  PriceChart,
  SignalBadge,
} from "./market-chart-parts";
import {
  computeFibonacciLevels,
  formatCurrency,
  formatPricePoints,
  WORKER_BASE_URL,
} from "./world-economic-parts";

/* ── Constants ───────────────────────────────────────── */

const REFETCH_INTERVAL = 300_000;
const STALE_TIME = 600_000;
const CHART_DAYS = "30";
const FULL = 100;
const PRICE_CHANGE_DECIMALS = 2;

const TRADEABLE_SYMBOLS = new Set(["BTC", "ETH", "XRP", "SOL", "BNB", "MATIC"]);

const TABLE_PAGE_SIZE = 7;
const SAMPLE_INTERVAL = 3;

/* ── Helpers ─────────────────────────────────────────── */

function isTradeable(symbol: string | undefined): boolean {
  return !!symbol && TRADEABLE_SYMBOLS.has(symbol);
}

function getCoingeckoId(topicName: string): string | null {
  const symbol = TOPIC_TO_CRYPTO_MAP[topicName];
  if (!symbol || !isTradeable(symbol)) return null;
  const coin = TOP_CRYPTO_COINS.find((c) => c.symbol === symbol);
  return coin?.coingeckoId ?? null;
}

function sampleChartData(data: ChartPoint[]): ChartPoint[] {
  if (data.length <= TABLE_PAGE_SIZE) return data;
  const sampled: ChartPoint[] = [];
  for (let i = 0; i < data.length; i += SAMPLE_INTERVAL) {
    sampled.push(data[i]);
  }
  const last = data[data.length - 1];
  if (sampled[sampled.length - 1]?.timestamp !== last.timestamp) {
    sampled.push(last);
  }
  return sampled;
}

/* ── Exchange Listing Section ────────────────────────── */

function ExchangeListingBadges({ symbol }: { symbol: string }) {
  const listings = EXCHANGE_LISTINGS[symbol];
  if (!listings || listings.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-medium text-muted-foreground">
        Available on
      </span>
      <div className="flex flex-wrap gap-1">
        {listings.map((ex) => (
          <Badge
            key={`${ex.venue}-${ex.type}`}
            variant="outline"
            className="gap-1 px-1.5 py-0 text-[10px]"
            style={{
              borderColor: `${EXCHANGE_TYPE_COLORS[ex.type]}40`,
              color: EXCHANGE_TYPE_COLORS[ex.type],
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ex.color }}
            />
            {ex.venue}
            <span className="opacity-60">{EXCHANGE_TYPE_LABELS[ex.type]}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ── Price Data Table ────────────────────────────────── */

function PriceDataTable({ data }: { data: ChartPoint[] }) {
  const sampled = sampleChartData(data);
  if (sampled.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Table2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Price Data</h3>
        <span className="text-[10px] text-muted-foreground">
          ({sampled.length} points)
        </span>
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                Price
              </th>
              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {sampled.map((point, idx) => {
              const prev = idx > 0 ? sampled[idx - 1].price : point.price;
              const change = ((point.price - prev) / prev) * FULL;
              const isPositive = change >= 0;

              let changeClass = "text-muted-foreground";
              if (idx !== 0) {
                changeClass = isPositive ? "text-emerald-600" : "text-red-600";
              }

              return (
                <tr
                  key={point.timestamp}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {point.fullDate}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium">
                    {formatCurrency(point.price)}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right font-semibold ${changeClass}`}
                  >
                    {idx === 0
                      ? "—"
                      : `${isPositive ? "+" : ""}${change.toFixed(PRICE_CHANGE_DECIMALS)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main Export: MarketChartTab ───────────────────── */

export function MarketChartTab({ topic }: { topic: MarketAsset }) {
  const symbol = TOPIC_TO_CRYPTO_MAP[topic.topic];
  const coingeckoId = getCoingeckoId(topic.topic);
  const coin = TOP_CRYPTO_COINS.find((c) => c.symbol === symbol);

  const {
    data: rawChart,
    isLoading: chartLoading,
    isError: chartError,
  } = useQuery<CoinGeckoChartResponse>({
    queryKey: ["market-chart", coingeckoId],
    queryFn: async () => {
      const res = await fetch(
        `${WORKER_BASE_URL}/api/crypto/chart/${coingeckoId}?days=${CHART_DAYS}`
      );
      if (!res.ok) throw new Error("Chart fetch failed");
      return res.json() as Promise<CoinGeckoChartResponse>;
    },
    enabled: !!coingeckoId,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
  });

  const { data: fgData, isLoading: fgLoading } = useQuery<FearGreedResponse>({
    queryKey: ["market-fear-greed"],
    queryFn: async () => {
      const res = await fetch(`${WORKER_BASE_URL}/api/crypto/fear-greed`);
      if (!res.ok) throw new Error("Fear & Greed fetch failed");
      return res.json() as Promise<FearGreedResponse>;
    },
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
  });

  const { data: fundingData } = useQuery<FundingRateResult>({
    queryKey: ["market-funding-rate", symbol],
    queryFn: async () => {
      const res = await fetch(
        `${WORKER_BASE_URL}/api/crypto/funding-rate?symbol=${symbol}/USDT`
      );
      if (!res.ok) throw new Error("Funding rate fetch failed");
      return res.json() as Promise<FundingRateResult>;
    },
    enabled: symbol === "BTC" || symbol === "ETH",
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
  });

  const { data: oiData } = useQuery<OpenInterestResult>({
    queryKey: ["market-open-interest", symbol],
    queryFn: async () => {
      const res = await fetch(
        `${WORKER_BASE_URL}/api/crypto/open-interest?symbol=${symbol}/USDT`
      );
      if (!res.ok) throw new Error("OI fetch failed");
      return res.json() as Promise<OpenInterestResult>;
    },
    enabled: symbol === "BTC" || symbol === "ETH",
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
  });

  const chartData = rawChart ? formatPricePoints(rawChart) : [];
  const fibLevels = computeFibonacciLevels(chartData);

  const currentPrice =
    chartData.length > 0 ? chartData[chartData.length - 1].price : null;
  const firstPrice = chartData.length > 0 ? chartData[0].price : null;
  const priceChange =
    currentPrice && firstPrice
      ? ((currentPrice - firstPrice) / firstPrice) * FULL
      : null;

  const fgScore = fgData?.data?.[0] ? parseInt(fgData.data[0].value, 10) : null;
  const fgZone = fgScore !== null ? getFgZone(fgScore) : null;

  const fundingInterp: Interpretation = fundingData?.success
    ? interpretFunding(fundingData.interpretation)
    : "neutral";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {coin?.image && (
          <img
            src={coin.image}
            alt={coin.name}
            className="h-8 w-8 rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {coin?.name ?? topic.topic}
            </span>
            <span className="text-xs text-muted-foreground">{symbol}</span>
          </div>
          {currentPrice !== null && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {formatCurrency(currentPrice)}
              </span>
              {priceChange !== null && (
                <span
                  className={`flex items-center text-xs font-semibold ${priceChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {priceChange >= 0 ? (
                    <TrendingUp className="mr-0.5 h-3 w-3" />
                  ) : (
                    <ArrowDown className="mr-0.5 h-3 w-3" />
                  )}
                  {priceChange >= 0 ? "+" : ""}
                  {priceChange.toFixed(PRICE_CHANGE_DECIMALS)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {symbol && <ExchangeListingBadges symbol={symbol} />}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{CHART_DAYS}D Price Chart</h3>
        </div>
        <div className="rounded-md border p-2">
          <PriceChart
            chartData={chartData}
            fibLevels={fibLevels}
            isLoading={chartLoading}
            error={chartError}
            coinName={coin?.name ?? topic.topic}
          />
        </div>
      </div>

      <PriceDataTable data={chartData} />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Trading Signals</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border p-2.5">
            <div className="text-[10px] text-muted-foreground">
              Fear & Greed Index
            </div>
            <FearGreedContent
              loading={fgLoading}
              score={fgScore}
              zone={fgZone}
            />
          </div>
          <div className="rounded-md border p-2.5">
            <div className="text-[10px] text-muted-foreground">
              Market Signal
            </div>
            <MarketSignalCard
              fgScore={fgScore}
              priceChange={priceChange}
              fundingInterp={fundingInterp}
              hasFunding={!!fundingData?.success}
            />
          </div>
        </div>
        {(fundingData?.success || oiData?.success) && (
          <div className="grid grid-cols-2 gap-2">
            {fundingData?.success && (
              <SignalBadge
                label="Funding Rate"
                value={`${fundingData.ratePercent.toFixed(4)}%`}
                interpretation={fundingInterp}
              />
            )}
            {oiData?.success && (
              <SignalBadge
                label="Open Interest"
                value={`$${(oiData.openInterest / 1_000_000).toFixed(1)}M`}
                interpretation="neutral"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { isTradeable, getCoingeckoId, TRADEABLE_SYMBOLS };
