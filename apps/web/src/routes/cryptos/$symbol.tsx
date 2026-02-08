import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Coins,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/assets/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { useTranslate } from "@/hooks/use-translate";
import { ShareMenu } from "@/features/crypto/share-menu";
import {
  type CryptoWithMarketData,
  formatCurrency,
  formatFullDate,
  formatPercentage,
  getAge,
  isBirthdayToday,
} from "@/features/crypto/crypto-utils";
import { PredictionTab } from "@/features/crypto/prediction-tab";
import {
  BirthdayTab,
  MarketTab,
  CosmicTab,
} from "@/features/crypto/market-cosmic-tabs";
import { ChartTab } from "@/features/crypto/chart-tab";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

export const Route = createFileRoute("/cryptos/$symbol")({
  component: CryptoBirthdayDetailPage,
});

function CryptoBirthdayDetailPage() {
  const { symbol } = Route.useParams();
  const [copied, setCopied] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const t = useTranslate();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const {
    data: cryptos,
    isLoading,
    error,
    refetch,
  } = useQuery<CryptoWithMarketData[]>({
    queryKey: ["crypto-market"],
    queryFn: async () => {
      const response = await fetch(`${WORKER_URL}/api/crypto/market`);
      if (!response.ok) throw new Error("Failed to fetch crypto data");
      const json = await response.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });

  const crypto = cryptos?.find(
    (c) => c.symbol.toLowerCase() === symbol.toLowerCase(),
  );

  const getShareText = () =>
    `Check out ${crypto?.name}'s (${crypto?.symbol}) cosmic birthday profile on Neptu! 🌟✨`;
  const getShareUrl = () =>
    `${window.location.origin}${window.location.pathname}#${activeTab}`;

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(getShareUrl())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const shareToLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const shareToWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(getShareText() + " " + getShareUrl())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const shareToTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${crypto?.name} (${crypto?.symbol}) - Crypto Birthday`,
          text: getShareText(),
          url: getShareUrl(),
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed silently
    }
  };

  const validTabs = [
    "overview",
    "birthday",
    "market",
    "chart",
    "prediction",
    "cosmic",
  ];
  const hashTab =
    typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  const initialTab = validTabs.includes(hashTab) ? hashTab : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const onTabChange = useCallback((value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, "", `#${value}`);
  }, []);

  const isPriceUp = (crypto?.priceChangePercentage24h ?? 0) >= 0;
  const isBirthday = crypto ? isBirthdayToday(crypto.birthday) : false;
  const age = crypto ? getAge(crypto.birthday) : 0;

  const tabContent = useMemo(() => {
    if (!crypto) return null;
    switch (activeTab) {
      case "birthday":
        return <BirthdayTab crypto={crypto} />;
      case "market":
        return <MarketTab crypto={crypto} />;
      case "chart":
        return <ChartTab crypto={crypto} />;
      case "prediction":
        return <PredictionTab crypto={crypto} />;
      case "cosmic":
        return <CosmicTab crypto={crypto} />;
      default:
        return null;
    }
  }, [activeTab, crypto]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/cryptos"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("crypto.backToCryptos")}</span>
          </Link>
        </div>

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

        {!isLoading && !error && !crypto && (
          <Card className="mx-auto max-w-md">
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                {t("crypto.notFound")}: "{symbol}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("crypto.notFoundDesc")}
              </p>
              <Link to="/cryptos">
                <Button className="mt-4">{t("crypto.backToCryptos")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {crypto && (
          <div className="max-w-4xl mx-auto">
            {/* Header Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {crypto.image && (
                      <img
                        src={crypto.image}
                        alt={crypto.name}
                        className="h-16 w-16 rounded-full"
                      />
                    )}
                    <div>
                      <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                        {crypto.name}
                        <span className="text-lg font-normal text-muted-foreground">
                          {crypto.symbol}
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Born {formatFullDate(crypto.birthday)}</span>
                        <span>•</span>
                        <span>{age} years old</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isBirthday && (
                      <Badge className="animate-pulse bg-primary text-primary-foreground">
                        🎂 {t("crypto.birthdayToday")}
                      </Badge>
                    )}
                    {crypto.currentPrice && (
                      <Badge
                        className={
                          isPriceUp
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }
                      >
                        {isPriceUp ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercentage(crypto.priceChangePercentage24h)}
                      </Badge>
                    )}
                    <ShareMenu
                      copied={copied}
                      t={t}
                      shareToTwitter={shareToTwitter}
                      shareToFacebook={shareToFacebook}
                      shareToLinkedIn={shareToLinkedIn}
                      shareToWhatsApp={shareToWhatsApp}
                      shareToTelegram={shareToTelegram}
                      handleNativeShare={handleNativeShare}
                      copyToClipboard={copyToClipboard}
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <div ref={sentinelRef} className="h-0" />
            <Tabs
              value={activeTab}
              onValueChange={onTabChange}
              className="space-y-6"
            >
              <div
                className={`sticky top-14 sm:top-16 z-40 bg-background py-2 overflow-x-auto scrollbar-none ${isStuck ? "w-screen -ml-[calc(50vw-50%)] px-[calc(50vw-50%)] border-b border-border/50 shadow-sm" : ""}`}
              >
                <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6">
                  <TabsTrigger value="overview" className="px-3 sm:px-4">
                    {t("crypto.tabs.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="birthday" className="px-3 sm:px-4">
                    {t("crypto.tabs.birthday")}
                  </TabsTrigger>
                  <TabsTrigger value="market" className="px-3 sm:px-4">
                    {t("crypto.tabs.market")}
                  </TabsTrigger>
                  <TabsTrigger value="chart" className="px-3 sm:px-4">
                    {t("crypto.tabs.chart")}
                  </TabsTrigger>
                  <TabsTrigger value="prediction" className="px-3 sm:px-4">
                    {t("crypto.tabs.prediction")}
                  </TabsTrigger>
                  <TabsTrigger value="cosmic" className="px-3 sm:px-4">
                    {t("crypto.tabs.cosmic")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-4">
                {crypto.description && (
                  <Card>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {crypto.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-xs">
                          {t("crypto.overview.currentPrice")}
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {formatCurrency(crypto.currentPrice)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Coins className="h-4 w-4" />
                        <span className="text-xs">
                          {t("crypto.overview.marketCap")}
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {formatCurrency(crypto.marketCap)}
                      </p>
                      {crypto.marketCapRank && (
                        <p className="text-xs text-muted-foreground">
                          {t("crypto.overview.rank")} #{crypto.marketCapRank}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-2 sm:gap-4">
                  <Card>
                    <CardContent className="p-3 sm:px-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        {t("crypto.overview.24hHigh")}
                      </p>
                      <p className="text-sm sm:text-xl font-semibold text-green-600">
                        {formatCurrency(crypto.high24h)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:px-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        {t("crypto.overview.24hLow")}
                      </p>
                      <p className="text-sm sm:text-xl font-semibold text-red-600">
                        {formatCurrency(crypto.low24h)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:px-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        {t("crypto.overview.24hVolume")}
                      </p>
                      <p className="text-sm sm:text-xl font-semibold">
                        {formatCurrency(crypto.totalVolume)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="birthday" className="space-y-4">
                {activeTab === "birthday" && tabContent}
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
                {activeTab === "market" && tabContent}
              </TabsContent>

              <TabsContent value="chart" className="space-y-4">
                {activeTab === "chart" && tabContent}
              </TabsContent>

              <TabsContent value="prediction" className="space-y-4">
                {activeTab === "prediction" && tabContent}
              </TabsContent>

              <TabsContent value="cosmic" className="space-y-4">
                {activeTab === "cosmic" && tabContent}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="mt-16 text-center text-sm text-muted-foreground">
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
        </div>
      </main>
    </div>
  );
}
