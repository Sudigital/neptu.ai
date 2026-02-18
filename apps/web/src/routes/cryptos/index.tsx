import { Logo } from "@/assets/logo";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CryptoWithMarketData,
  formatCurrency,
  formatPercentage,
  getAge,
  isBirthdayToday,
  isBirthdayThisMonth,
} from "@/features/crypto/crypto-utils";
import { useTranslate } from "@/hooks/use-translate";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
import React, { useState } from "react";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

export const Route = createFileRoute("/cryptos/")({
  component: CryptoBirthdaysPage,
});

function CryptoBirthdaysPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const t = useTranslate();
  const {
    data: cryptos,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<CryptoWithMarketData[]>({
    queryKey: ["crypto-market"],
    queryFn: async () => {
      const response = await fetch(`${WORKER_URL}/api/crypto/market`);
      if (!response.ok) throw new Error("Failed to fetch crypto data");
      const json = await response.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // 10 minutes
  });

  // Sort cryptos: birthday today first, then this month, then by market cap
  const sortedCryptos = cryptos?.slice().sort((a, b) => {
    const aToday = isBirthdayToday(a.birthday);
    const bToday = isBirthdayToday(b.birthday);
    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;

    const aThisMonth = isBirthdayThisMonth(a.birthday);
    const bThisMonth = isBirthdayThisMonth(b.birthday);
    if (aThisMonth && !bThisMonth) return -1;
    if (!aThisMonth && bThisMonth) return 1;

    return (b.marketCap ?? 0) - (a.marketCap ?? 0);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {t("crypto.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("crypto.description")}
          </p>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            {cryptos && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {cryptos.length} {t("crypto.cryptocurrencies")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Logo className="mx-auto h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                {t("crypto.loading")}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mx-auto max-w-md">
            <CardContent className="text-center">
              <p className="text-destructive">{t("crypto.loadFailed")}</p>
              <Button onClick={() => refetch()} className="mt-4">
                {t("crypto.tryAgain")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Crypto Grid/List */}
        {sortedCryptos &&
          (viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedCryptos.map((crypto, index) => (
                <CryptoCard key={crypto.symbol} crypto={crypto} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCryptos.map((crypto, index) => (
                <CryptoListItem
                  key={crypto.symbol}
                  crypto={crypto}
                  index={index}
                />
              ))}
            </div>
          ))}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center text-sm text-muted-foreground"
        >
          <p>
            {t("crypto.marketDataFrom")}{" "}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              CoinGecko
            </a>{" "}
            • {t("crypto.cosmicInsightsPoweredBy")}{" "}
            <span className="text-primary">Neptu</span>{" "}
            {t("crypto.balineseAstrology")}
          </p>
          <p className="mt-2">
            {t("crypto.dataRefreshesHourly")} • {t("crypto.lastUpdated")}:{" "}
            {cryptos?.[0]?.lastUpdated
              ? new Date(cryptos[0].lastUpdated).toLocaleString()
              : "-"}
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function CryptoCard({
  crypto,
  index,
}: {
  crypto: CryptoWithMarketData;
  index: number;
}) {
  const t = useTranslate();
  const isBirthday = isBirthdayToday(crypto.birthday);
  const isThisMonth = isBirthdayThisMonth(crypto.birthday);
  const age = getAge(crypto.birthday);
  const isPriceUp = (crypto.priceChangePercentage24h ?? 0) >= 0;

  // Format birthday for display (YYYY-MM-DD → MMM DD)
  const formatBirthday = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Link
      to="/cryptos/$symbol"
      params={{ symbol: crypto.symbol.toLowerCase() }}
      className="block h-full"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="h-full"
      >
        <Card
          className={`group relative flex h-full cursor-pointer flex-col overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg ${isBirthday ? "border-2 border-primary ring-2 ring-primary/20" : ""}${!isBirthday && isThisMonth ? " border-primary/50" : ""}`}
        >
          {/* Birthday Badge */}
          {isBirthday && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="animate-pulse bg-primary text-primary-foreground">
                🎂 {t("crypto.birthdayToday")}
              </Badge>
            </div>
          )}
          {isThisMonth && !isBirthday && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary">{t("crypto.thisMonth")}</Badge>
            </div>
          )}

          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              {/* Crypto Logo */}
              {crypto.image ? (
                <img
                  src={crypto.image}
                  alt={crypto.name}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">
                    {crypto.symbol.slice(0, 2)}
                  </span>
                </div>
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {crypto.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    {crypto.symbol}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatBirthday(crypto.birthday)} • {age}{" "}
                    {t("crypto.yearsOld")}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col justify-between space-y-3">
            {/* Price Info - Only show when market data is available */}
            {crypto.currentPrice ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(crypto.currentPrice)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    MCap: {formatCurrency(crypto.marketCap)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium ${
                    isPriceUp
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  {isPriceUp ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {formatPercentage(crypto.priceChangePercentage24h)}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("crypto.marketDataLoading")}
                </p>
              </div>
            )}

            {/* Cosmic Alignment Preview */}
            {crypto.cosmicAlignment && (
              <div className="rounded-lg bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {t("crypto.cosmicScore")}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {crypto.cosmicAlignment.alignmentScore}%
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground italic">
                  "{crypto.cosmicAlignment.cosmicMessage}"
                </p>
              </div>
            )}

            {/* Click hint */}
            <p className="mt-auto border-t pt-2 text-center text-xs text-muted-foreground">
              {t("crypto.clickForDetails")}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

function CryptoListItem({
  crypto,
  index,
}: {
  crypto: CryptoWithMarketData;
  index: number;
}) {
  const t = useTranslate();
  const isBirthday = isBirthdayToday(crypto.birthday);
  const isThisMonth = isBirthdayThisMonth(crypto.birthday);
  const age = getAge(crypto.birthday);
  const isPriceUp = (crypto.priceChangePercentage24h ?? 0) >= 0;

  const formatBirthday = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Link
      to="/cryptos/$symbol"
      params={{ symbol: crypto.symbol.toLowerCase() }}
      className="block"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Card
          className={`group cursor-pointer transition-all hover:bg-muted/30 hover:shadow-md ${isBirthday ? "border-2 border-primary ring-2 ring-primary/20" : ""}${!isBirthday && isThisMonth ? " border-primary/50" : ""}`}
        >
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Rank - hidden on mobile */}
              <span className="hidden w-6 text-center text-sm text-muted-foreground sm:block">
                {index + 1}
              </span>

              {/* Crypto Logo */}
              {crypto.image ? (
                <img
                  src={crypto.image}
                  alt={crypto.name}
                  className="h-10 w-10 flex-shrink-0 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-bold text-primary">
                    {crypto.symbol.slice(0, 2)}
                  </span>
                </div>
              )}

              {/* Name & Birthday */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{crypto.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {crypto.symbol}
                  </span>
                  {isBirthday && (
                    <Badge className="animate-pulse bg-primary text-xs text-primary-foreground">
                      🎂{" "}
                      <span className="hidden sm:inline">
                        {t("crypto.birthdayToday").replace("!", "")}
                      </span>
                    </Badge>
                  )}
                  {isThisMonth && !isBirthday && (
                    <Badge
                      variant="secondary"
                      className="hidden text-xs sm:inline-flex"
                    >
                      {t("crypto.thisMonth")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatBirthday(crypto.birthday)} • {age}y
                  </span>
                  {/* Show price on mobile inline */}
                  <span className="ml-1 sm:hidden">
                    • {formatCurrency(crypto.currentPrice)}
                  </span>
                </div>
              </div>

              {/* Cosmic Score - hidden on mobile */}
              {crypto.cosmicAlignment && (
                <div className="hidden items-center gap-2 md:flex">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Badge variant="outline">
                    {crypto.cosmicAlignment.alignmentScore}%
                  </Badge>
                </div>
              )}

              {/* Price - hidden on mobile */}
              <div className="hidden min-w-[100px] text-right sm:block">
                <p className="font-semibold">
                  {formatCurrency(crypto.currentPrice)}
                </p>
                <p className="text-xs text-muted-foreground">
                  MCap: {formatCurrency(crypto.marketCap)}
                </p>
              </div>

              {/* 24h Change */}
              <div
                className={`flex min-w-[60px] items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:min-w-[80px] sm:text-sm ${
                  isPriceUp
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {isPriceUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPercentage(crypto.priceChangePercentage24h)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
