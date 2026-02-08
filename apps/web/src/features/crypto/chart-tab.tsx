import { useMemo, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslate } from "@/hooks/use-translate";
import {
  type CryptoWithMarketData,
  formatCurrency,
  formatFullDate,
} from "./crypto-utils";
import { analyzeCrypto, getNextStrongest } from "./cosmic-prediction";
import {
  type CoinGeckoChartData,
  formatPriceData,
  mergeWithPredictions,
} from "./chart-utils";
import { PriceChart } from "./chart-components";

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
  const [showPrediction, setShowPrediction] = useState(false);
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
        ? formatPriceData(
            chartRaw,
            crypto.ath,
            crypto.atl,
            crypto.athDate,
            crypto.atlDate,
            crypto.currentPrice,
          )
        : [],
    [
      chartRaw,
      crypto.ath,
      crypto.atl,
      crypto.athDate,
      crypto.atlDate,
      crypto.currentPrice,
    ],
  );

  const prediction = useMemo(() => analyzeCrypto(crypto), [crypto]);
  const nextStrongest = useMemo(
    () => (prediction ? getNextStrongest(prediction) : null),
    [prediction],
  );

  // Merge history + prediction into one dataset when prediction is on
  const chartData = useMemo(() => {
    if (!showPrediction || !prediction) return historyData;
    return mergeWithPredictions(
      historyData,
      prediction.events,
      prediction.currentPrice,
    );
  }, [historyData, showPrediction, prediction]);

  return (
    <>
      {/* Chart */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">
                {t("crypto.chart.title")}
              </h4>
            </div>
            <button
              onClick={() => setShowPrediction((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showPrediction
                  ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("crypto.chart.prediction")}
            </button>
          </div>

          <div className="flex gap-1 mb-4">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
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
          <div className="flex items-center gap-4 mb-3 text-xs flex-wrap">
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
            {showPrediction && prediction && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-amber-500" />
                  <span className="text-muted-foreground">
                    {t("crypto.chart.prediction")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">ATH Match</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">ATL Match</span>
                </div>
              </>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading chart data...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Failed to load chart data
            </div>
          ) : (
            <PriceChart
              data={chartData}
              showPrediction={showPrediction}
              ath={crypto.ath}
              atl={crypto.atl}
              currentPrice={prediction?.currentPrice}
            />
          )}
        </CardContent>
      </Card>

      {/* ATL & ATH Summary with Cosmic Signatures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="relative">
            {crypto.atlCosmic && (
              <Badge className="absolute top-3 right-3 bg-red-500/10 text-red-600">
                {t("crypto.market.score")}: {crypto.atlCosmic.score}%
              </Badge>
            )}
            <div className="flex items-center gap-2 mb-3">
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
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
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
            <div className="flex items-center gap-2 mb-3">
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
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
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
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">
                {t("crypto.chart.cosmicPrediction")}
              </h4>
              <Badge variant="outline" className="ml-auto text-xs">
                {t("crypto.chart.cosmicBased")}
              </Badge>
            </div>

            {prediction && (
              <div className="mb-4 rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-sm mb-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Cosmic Signature Analysis
                </div>
                <p>
                  <span className="text-green-600 font-medium">
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
                  <span className="text-red-600 font-medium">ATL Pattern:</span>{" "}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {t("crypto.chart.nextATH")}
                  </span>
                  {nextStrongest.nextATH && (
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[10px] ${
                        nextStrongest.nextATH.matchLevel === "full"
                          ? "border-green-500 text-green-600 bg-green-500/10"
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
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatFullDate(
                          nextStrongest.nextATH.date.toISOString(),
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~
                      {Math.round(
                        (nextStrongest.nextATH.date.getTime() - now) / 86400000,
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

              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    {t("crypto.chart.nextATL")}
                  </span>
                  {nextStrongest.nextATL && (
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[10px] ${
                        nextStrongest.nextATL.matchLevel === "full"
                          ? "border-red-500 text-red-600 bg-red-500/10"
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
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatFullDate(
                          nextStrongest.nextATL.date.toISOString(),
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~
                      {Math.round(
                        (nextStrongest.nextATL.date.getTime() - now) / 86400000,
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
            <p className="text-xs text-muted-foreground mt-4 italic text-center">
              {t("crypto.chart.disclaimer")}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
