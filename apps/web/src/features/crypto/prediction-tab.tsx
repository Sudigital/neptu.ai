import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import {
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { analyzeCrypto, type CosmicPredictionEvent } from "./cosmic-prediction";
import { type CryptoWithMarketData, formatCurrency } from "./crypto-utils";

export function PredictionTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();
  const currentPrice = crypto.currentPrice || 0;
  const ath = crypto.ath || 0;
  const atl = crypto.atl || 0;

  const athDistance = ath > 0 ? ((ath - currentPrice) / currentPrice) * 100 : 0;
  const atlDistance = atl > 0 ? ((currentPrice - atl) / atl) * 100 : 0;
  const priceRange = ath - atl;
  const pricePosition =
    priceRange > 0 ? ((currentPrice - atl) / priceRange) * 100 : 50;

  const resistance1 = currentPrice * 1.1;
  const resistance2 = currentPrice * 1.25;
  const support1 = currentPrice * 0.9;
  const support2 = currentPrice * 0.75;

  const fib236 = ath - priceRange * 0.236;
  const fib382 = ath - priceRange * 0.382;
  const fib50 = ath - priceRange * 0.5;
  const fib618 = ath - priceRange * 0.618;

  let sentiment = t("crypto.prediction.neutral");
  let sentimentColor = "text-yellow-500";
  let sentimentBg = "bg-yellow-500/10";
  if (pricePosition > 70) {
    sentiment = t("crypto.prediction.bullish");
    sentimentColor = "text-green-500";
    sentimentBg = "bg-green-500/10";
  } else if (pricePosition < 30) {
    sentiment = t("crypto.prediction.bearish");
    sentimentColor = "text-red-500";
    sentimentBg = "bg-red-500/10";
  }

  const cosmicScore = crypto.cosmicAlignment?.alignmentScore || 50;
  const cosmicBoost =
    cosmicScore > 70
      ? t("crypto.prediction.high")
      : cosmicScore > 40
        ? t("crypto.prediction.medium")
        : t("crypto.prediction.low");

  return (
    <>
      {/* Price Position Card */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold">
              {t("crypto.prediction.pricePosition")}
            </h4>
          </div>
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>ATL: {formatCurrency(atl)}</span>
              <span>ATH: {formatCurrency(ath)}</span>
            </div>
            <div className="relative h-4 rounded-full bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20">
              <div
                className="absolute top-0 h-4 w-1 -translate-x-1/2 transform rounded-full bg-primary"
                style={{ left: `${Math.min(Math.max(pricePosition, 2), 98)}%` }}
              />
            </div>
            <div className="mt-2 text-center">
              <span className="text-sm font-medium">
                Current: {formatCurrency(currentPrice)}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({pricePosition.toFixed(1)}% from ATL)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="rounded-lg bg-green-500/10 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <ChevronUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  {t("crypto.prediction.toATH")}
                </span>
              </div>
              <p className="text-lg font-bold text-green-600 sm:text-xl">
                +{athDistance.toFixed(1)}%
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatCurrency(ath - currentPrice)}{" "}
                {t("crypto.prediction.needed")}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">
                  {t("crypto.prediction.fromATL")}
                </span>
              </div>
              <p className="text-lg font-bold text-red-600 sm:text-xl">
                +{atlDistance.toFixed(1)}%
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatCurrency(currentPrice - atl)}{" "}
                {t("crypto.prediction.gained")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Sentiment */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold">
              {t("crypto.prediction.marketSentiment")}
            </h4>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className={`rounded-xl px-8 py-4 text-center ${sentimentBg}`}>
              <p className={`text-3xl font-bold ${sentimentColor}`}>
                {sentiment}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("crypto.prediction.basedOnPosition")}
              </p>
            </div>
          </div>
          {crypto.cosmicAlignment && (
            <div className="mt-4 rounded-lg bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {t("crypto.prediction.cosmicEnergyBoost")}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    cosmicScore > 70
                      ? "border-green-500 text-green-500"
                      : cosmicScore > 40
                        ? "border-yellow-500 text-yellow-500"
                        : "border-red-500 text-red-500"
                  }
                >
                  {cosmicBoost}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {cosmicScore}% {t("crypto.prediction.cosmicAlignment")} •{" "}
                {crypto.cosmicAlignment.wuku} {t("crypto.prediction.cycle")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fibonacci Levels */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold">
              {t("crypto.prediction.fibonacci")}
            </h4>
          </div>
          <div className="space-y-3">
            {[
              { level: "0% (ATH)", price: ath, color: "text-green-500" },
              { level: "23.6%", price: fib236, color: "text-green-400" },
              { level: "38.2%", price: fib382, color: "text-yellow-500" },
              { level: "50%", price: fib50, color: "text-yellow-600" },
              { level: "61.8%", price: fib618, color: "text-orange-500" },
              { level: "100% (ATL)", price: atl, color: "text-red-500" },
            ].map((fib) => (
              <div
                key={fib.level}
                className="flex items-center justify-between text-sm"
              >
                <span className={`font-medium ${fib.color}`}>{fib.level}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{formatCurrency(fib.price)}</span>
                  {Math.abs(currentPrice - fib.price) / currentPrice < 0.05 && (
                    <Badge variant="secondary" className="text-xs">
                      {t("crypto.prediction.near")}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support & Resistance */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-green-500" />
            <ArrowDown className="h-5 w-5 text-red-500" />
            <h4 className="text-lg font-semibold">
              {t("crypto.prediction.supportResistance")}
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-green-500" />{" "}
                {t("crypto.prediction.resistanceLevels")}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-500">R1 (+10%)</span>
                  <span className="font-mono">
                    {formatCurrency(resistance1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">R2 (+25%)</span>
                  <span className="font-mono">
                    {formatCurrency(resistance2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">ATH</span>
                  <span className="font-mono">{formatCurrency(ath)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowDown className="h-3 w-3 text-red-500" />{" "}
                {t("crypto.prediction.supportLevels")}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-500">S1 (-10%)</span>
                  <span className="font-mono">{formatCurrency(support1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">S2 (-25%)</span>
                  <span className="font-mono">{formatCurrency(support2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-700">ATL</span>
                  <span className="font-mono">{formatCurrency(atl)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cosmic Date Predictions */}
      <CosmicDatePredictions crypto={crypto} t={t} />

      {/* Disclaimer */}
      <Card className="border-yellow-500/50">
        <CardContent>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-yellow-600">
                {t("crypto.prediction.disclaimer")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("crypto.prediction.disclaimerText")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function CosmicDatePredictions({
  crypto,
  t,
}: {
  crypto: CryptoWithMarketData;
  t: (key: string) => string;
}) {
  const prediction = analyzeCrypto(crypto);
  if (!prediction) return null;

  const athEvents = prediction.events
    .filter((e) => e.type === "ath")
    .slice(0, 5);
  const atlEvents = prediction.events
    .filter((e) => e.type === "atl")
    .slice(0, 5);

  if (!athEvents.length && !atlEvents.length) return null;

  const today = new Date();
  const maxRows = Math.max(athEvents.length, atlEvents.length);

  const formatEventDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });

  const daysFromNow = (d: Date) =>
    Math.round((d.getTime() - today.getTime()) / 86400000);

  const renderEvent = (
    ev: CosmicPredictionEvent | undefined,
    colorClass: string,
    bgClass: string
  ) => {
    if (!ev) return <td className="px-2 py-3" />;
    const days = daysFromNow(ev.date);
    return (
      <td className="px-2 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono ${colorClass} ${bgClass} rounded px-2 py-1 text-xs sm:text-sm`}
            >
              {formatEventDate(ev.date)}
            </span>
            {ev.matchLevel === "full" && (
              <Badge className={`${bgClass} ${colorClass} text-[10px]`}>
                Full
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{ev.wuku}</span>
            <span>•</span>
            <span>{ev.caturWara}</span>
            <span>•</span>
            <span>{days}d</span>
            <span>•</span>
            <span>{formatCurrency(ev.predictedPrice)}</span>
          </div>
        </div>
      </td>
    );
  };

  return (
    <Card className="border-primary/50">
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <Sparkles className="h-5 w-5 text-primary" />
          <h4 className="text-lg font-semibold">
            {t("crypto.prediction.cosmicDatePredictions")}
          </h4>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("crypto.prediction.cosmicDateDesc")}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                  #
                </th>
                {athEvents.length > 0 && (
                  <th className="px-2 py-2 text-left">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span className="font-medium text-green-600">
                        {t("crypto.prediction.athEnergy")}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-1 border-green-500 text-xs text-green-500"
                      >
                        {prediction.athSignature.wuku}
                      </Badge>
                    </div>
                    <p className="text-xs font-normal text-muted-foreground">
                      {prediction.athSignature.pancaWara} •{" "}
                      {prediction.athSignature.saptaWara}
                    </p>
                  </th>
                )}
                {atlEvents.length > 0 && (
                  <th className="px-2 py-2 text-left">
                    <div className="flex items-center gap-1">
                      <ArrowDown className="h-3 w-3 text-red-500" />
                      <span className="font-medium text-red-600">
                        {t("crypto.prediction.atlEnergy")}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-1 border-red-500 text-xs text-red-500"
                      >
                        {prediction.atlSignature.wuku}
                      </Badge>
                    </div>
                    <p className="text-xs font-normal text-muted-foreground">
                      {prediction.atlSignature.pancaWara} •{" "}
                      {prediction.atlSignature.saptaWara}
                    </p>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }, (_, idx) => (
                <tr
                  key={idx}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="px-2 py-3 text-muted-foreground">{idx + 1}</td>
                  {athEvents.length > 0 &&
                    renderEvent(
                      athEvents[idx],
                      "text-green-600",
                      "bg-green-500/10"
                    )}
                  {atlEvents.length > 0 &&
                    renderEvent(
                      atlEvents[idx],
                      "text-red-600",
                      "bg-red-500/10"
                    )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-green-600">
            <div className="h-3 w-3 rounded bg-green-500/20" />
            <span>{t("crypto.prediction.bullishCosmicEnergy")}</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <div className="h-3 w-3 rounded bg-red-500/20" />
            <span>{t("crypto.prediction.bearishCosmicEnergy")}</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>{t("crypto.prediction.howItWorks")}:</strong>{" "}
            {t("crypto.prediction.howItWorksDesc")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
