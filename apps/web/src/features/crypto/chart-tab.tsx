import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PriceChart } from "./chart-components";
import { type CoinGeckoChartData, formatPriceData } from "./chart-utils";
import { analyzeCrypto, getNextStrongest } from "./cosmic-prediction";
import {
  type CryptoWithMarketData,
  formatCurrency,
  formatFullDate,
} from "./crypto-utils";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

const DAY_OPTIONS = [
  { label: "7D", value: "7" },
  { label: "30D", value: "30" },
  { label: "90D", value: "90" },
  { label: "1Y", value: "365" },
] as const;

export function ChartTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();
  const [days, setDays] = useState("365");

  const coingeckoId = crypto.coingeckoId;

  const [now] = useState(() => Date.now());

  const {
    data: chartRaw,
    isLoading,
    error,
  } = useQuery<CoinGeckoChartData>({
    queryKey: ["crypto-chart", coingeckoId, days],
    queryFn: async () => {
      const url = `${WORKER_URL}/api/crypto/chart/${coingeckoId}?days=${days}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Chart API error: ${res.status}`);
      return (await res.json()) as CoinGeckoChartData;
    },
    enabled: !!coingeckoId,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const historyData = useMemo(
    () =>
      chartRaw
        ? formatPriceData({
            rawData: chartRaw,
            ath: crypto.ath,
            atl: crypto.atl,
            athDate: crypto.athDate,
            atlDate: crypto.atlDate,
            currentPrice: crypto.currentPrice,
          })
        : [],
    [
      chartRaw,
      crypto.ath,
      crypto.atl,
      crypto.athDate,
      crypto.atlDate,
      crypto.currentPrice,
    ]
  );

  const prediction = useMemo(() => analyzeCrypto(crypto), [crypto]);
  const nextStrongest = useMemo(
    () => (prediction ? getNextStrongest(prediction) : null),
    [prediction]
  );

  return (
    <>
      {/* Chart */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold">
                {t("crypto.chart.title")}
              </h4>
            </div>
          </div>

          <div className="mb-4 flex gap-1">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  days === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 bg-[#7c3aed]" />
              <span className="text-muted-foreground">
                {t("crypto.chart.history")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t border-dashed border-green-500" />
              <span className="text-muted-foreground">ATH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t border-dashed border-red-500" />
              <span className="text-muted-foreground">ATL</span>
            </div>
          </div>

          {isLoading && (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loading chart data...
            </div>
          )}
          {!isLoading && error && (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Failed to load chart data
            </div>
          )}
          {!isLoading && !error && (
            <PriceChart data={historyData} ath={crypto.ath} atl={crypto.atl} />
          )}
        </CardContent>
      </Card>

      {/* ATL & ATH Summary with Cosmic Signatures */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="relative">
            {crypto.atlCosmic && (
              <Badge className="absolute top-3 right-3 bg-red-500/10 text-red-600">
                {t("crypto.market.score")}: {crypto.atlCosmic.score}%
              </Badge>
            )}
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h4 className="font-semibold">
                {t("crypto.chart.historicalATL")}
              </h4>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(crypto.atl)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatFullDate(crypto.atlDate)}
            </p>
            {prediction && (
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium">Cosmic:</span>{" "}
                  {prediction.atlSignature.saptaWara} +{" "}
                  {prediction.atlSignature.pancaWara}
                </p>
                <p>
                  <span className="font-medium">Wuku:</span>{" "}
                  {prediction.atlSignature.wuku} (urip:{" "}
                  {prediction.atlSignature.wukuUrip})
                </p>
                <p>
                  <span className="font-medium">Frekuensi:</span>{" "}
                  {prediction.atlSignature.frekuensi}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="relative">
            {crypto.athCosmic && (
              <Badge className="absolute top-3 right-3 bg-green-500/10 text-green-600">
                {t("crypto.market.score")}: {crypto.athCosmic.score}%
              </Badge>
            )}
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold">
                {t("crypto.chart.historicalATH")}
              </h4>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(crypto.ath)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatFullDate(crypto.athDate)}
            </p>
            {prediction && (
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium">Cosmic:</span>{" "}
                  {prediction.athSignature.saptaWara} +{" "}
                  {prediction.athSignature.pancaWara}
                </p>
                <p>
                  <span className="font-medium">Wuku:</span>{" "}
                  {prediction.athSignature.wuku} (urip:{" "}
                  {prediction.athSignature.wukuUrip})
                </p>
                <p>
                  <span className="font-medium">Frekuensi:</span>{" "}
                  {prediction.athSignature.frekuensi}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cosmic Prediction Cards */}
      {nextStrongest && (
        <Card className="border-primary/30">
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold">
                {t("crypto.chart.cosmicPrediction")}
              </h4>
              <Badge variant="outline" className="ml-auto text-xs">
                {t("crypto.chart.cosmicBased")}
              </Badge>
            </div>

            {prediction && (
              <div className="mb-4 space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Cosmic Signature Analysis
                </div>
                <p>
                  <span className="font-medium text-green-600">
                    ATH Pattern:
                  </span>{" "}
                  {prediction.athSignature.saptaWara} +{" "}
                  {prediction.athSignature.pancaWara} in Wuku{" "}
                  {prediction.athSignature.wuku} — Frekuensi:{" "}
                  <span className="font-medium">
                    {prediction.athSignature.frekuensi}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-red-600">ATL Pattern:</span>{" "}
                  {prediction.atlSignature.saptaWara} +{" "}
                  {prediction.atlSignature.pancaWara} in Wuku{" "}
                  {prediction.atlSignature.wuku} — Frekuensi:{" "}
                  <span className="font-medium">
                    {prediction.atlSignature.frekuensi}
                  </span>
                </p>
                <p className="text-muted-foreground italic">
                  Full match = PancaWara + SaptaWara + Wuku aligned (210-day
                  cycle)
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {t("crypto.chart.nextATH")}
                  </span>
                  {nextStrongest.nextATH && (
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[10px] ${
                        nextStrongest.nextATH.matchLevel === "full"
                          ? "border-green-500 bg-green-500/10 text-green-600"
                          : "border-green-500/50 text-green-500"
                      }`}
                    >
                      {nextStrongest.nextATH.matchLevel === "full"
                        ? "Full Match"
                        : "Partial"}
                    </Badge>
                  )}
                </div>
                {nextStrongest.nextATH ? (
                  <>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(nextStrongest.nextATH.predictedPrice)}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatFullDate(
                          nextStrongest.nextATH.date.toISOString()
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~
                      {Math.round(
                        (nextStrongest.nextATH.date.getTime() - now) / 86400000
                      )}{" "}
                      {t("crypto.chart.daysAway")} • Wuku:{" "}
                      {nextStrongest.nextATH.wuku} •{" "}
                      {nextStrongest.nextATH.caturWara} • Score:{" "}
                      {nextStrongest.nextATH.cosmicScore}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No ATH prediction available
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    {t("crypto.chart.nextATL")}
                  </span>
                  {nextStrongest.nextATL && (
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[10px] ${
                        nextStrongest.nextATL.matchLevel === "full"
                          ? "border-red-500 bg-red-500/10 text-red-600"
                          : "border-red-500/50 text-red-500"
                      }`}
                    >
                      {nextStrongest.nextATL.matchLevel === "full"
                        ? "Full Match"
                        : "Partial"}
                    </Badge>
                  )}
                </div>
                {nextStrongest.nextATL ? (
                  <>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(nextStrongest.nextATL.predictedPrice)}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatFullDate(
                          nextStrongest.nextATL.date.toISOString()
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~
                      {Math.round(
                        (nextStrongest.nextATL.date.getTime() - now) / 86400000
                      )}{" "}
                      {t("crypto.chart.daysAway")} • Wuku:{" "}
                      {nextStrongest.nextATL.wuku} •{" "}
                      {nextStrongest.nextATL.caturWara} • Score:{" "}
                      {nextStrongest.nextATL.cosmicScore}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No ATL prediction available
                  </p>
                )}
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground italic">
              {t("crypto.chart.disclaimer")}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
