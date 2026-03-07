import type { PersonDTO } from "@neptu/drizzle-orm";
import type { MarketResponse, MarketAsset } from "@neptu/shared";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  EXCHANGE_LISTINGS,
  EXCHANGE_TYPE_COLORS,
  EXCHANGE_TYPE_LABELS,
  MARKET_CATEGORY_CONFIG,
  SENTIMENT_CONFIG,
  TOPIC_TO_CRYPTO_MAP,
  TOPIC_TO_STOCK_MAP,
} from "@neptu/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Filter,
  Loader2,
  Minus,
  Newspaper,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { adminApi } from "./admin-api";
import { MarketDetailSheet } from "./market-detail";
import {
  EMPTY_FILTERS,
  FilterBar,
  hasActiveFilters,
  type FilterState,
} from "./market-filter";
import {
  analyzeTopic,
  formatTimeAgo,
  getSentimentColor,
  getSentimentLabel,
  MARKET_REFETCH_INTERVAL,
  MARKET_STALE_TIME,
  WORKER_BASE,
} from "./market-parts";

/* ── Helpers ─────────────────────────────────────────── */

const MAX_PERSONS = 500;

function SentimentIcon({
  sentiment,
  className,
}: {
  sentiment: string;
  className?: string;
}) {
  let Icon = Minus as typeof TrendingUp;
  if (sentiment === "bullish") Icon = TrendingUp;
  else if (sentiment === "bearish") Icon = TrendingDown;

  return (
    <Icon
      className={cn("h-5 w-5", className)}
      style={{
        color:
          SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG]?.color,
      }}
    />
  );
}

function getTopicGradient(sentiment: string): string {
  if (sentiment === "bullish") return "from-green-500/5 to-green-500/0";
  if (sentiment === "bearish") return "from-red-500/5 to-red-500/0";
  return "from-yellow-500/5 to-yellow-500/0";
}

function getExchangeListings(topic: MarketAsset) {
  const cryptoSymbol = TOPIC_TO_CRYPTO_MAP[topic.topic];
  if (cryptoSymbol && EXCHANGE_LISTINGS[cryptoSymbol]) {
    return EXCHANGE_LISTINGS[cryptoSymbol];
  }
  const stockSymbol = TOPIC_TO_STOCK_MAP[topic.topic];
  if (stockSymbol && EXCHANGE_LISTINGS[stockSymbol]) {
    return EXCHANGE_LISTINGS[stockSymbol];
  }
  return null;
}

/* ── Topic Card ──────────────────────────────────────── */

function TopicCard({
  topic,
  fetchedAt,
  onClick,
}: {
  topic: MarketAsset;
  fetchedAt: string;
  onClick: () => void;
}) {
  const analysis = analyzeTopic(topic, fetchedAt);
  const exchanges = getExchangeListings(topic);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md",
        "bg-gradient-to-br",
        getTopicGradient(topic.sentiment)
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SentimentIcon sentiment={topic.sentiment} />
            <CardTitle className="text-base">{topic.topic}</CardTitle>
          </div>
          <Badge
            variant="outline"
            style={{
              borderColor: getSentimentColor(topic.sentiment),
              color: getSentimentColor(topic.sentiment),
            }}
          >
            {getSentimentLabel(topic.sentiment)}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2 text-xs">
          <Newspaper className="h-3 w-3" />
          {topic.count} article{topic.count > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {topic.categories && topic.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topic.categories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="px-1.5 py-0 text-[10px]"
                style={{
                  backgroundColor: `${MARKET_CATEGORY_CONFIG[cat]?.color}15`,
                  color: MARKET_CATEGORY_CONFIG[cat]?.color,
                  borderColor: `${MARKET_CATEGORY_CONFIG[cat]?.color}30`,
                }}
              >
                {MARKET_CATEGORY_CONFIG[cat]?.label ?? cat}
              </Badge>
            ))}
          </div>
        )}

        {exchanges && exchanges.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              Listed on
            </span>
            <div className="flex flex-wrap gap-1">
              {exchanges.map((ex) => (
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
                  <span className="opacity-60">
                    {EXCHANGE_TYPE_LABELS[ex.type]}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {topic.recentHeadlines.slice(0, 2).map((headline, i) => (
            <p
              key={`${topic.topic}-hl-${i}`}
              className="truncate text-xs text-muted-foreground"
            >
              {headline}
            </p>
          ))}
          {topic.recentHeadlines.length > 2 && (
            <p className="text-xs text-muted-foreground/60">
              +{topic.recentHeadlines.length - 2} more
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Neptu Score</span>
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: analysis.investmentColor }}
          >
            {analysis.overallScore}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: analysis.investmentColor }}
          >
            {analysis.investmentLabel}
          </span>
          {analysis.relatedCoin && (
            <Badge variant="secondary" className="text-[10px]">
              {analysis.relatedCoin}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Summary Stats ───────────────────────────────────── */

function SummaryStats({ data }: { data: MarketResponse }) {
  const bullishCount = data.assets.filter(
    (t) => t.sentiment === "bullish"
  ).length;
  const bearishCount = data.assets.filter(
    (t) => t.sentiment === "bearish"
  ).length;
  const neutralCount = data.assets.filter(
    (t) => t.sentiment === "neutral"
  ).length;
  const totalMentions = data.assets.reduce((s, t) => s + t.count, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{data.assets.length}</p>
            <p className="text-xs text-muted-foreground">Assets Tracked</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <Newspaper className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{totalMentions}</p>
            <p className="text-xs text-muted-foreground">Total Mentions</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold">
              {bullishCount}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {bearishCount} / {neutralCount}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Bull / Bear / Neutral
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <Activity className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-2xl font-bold">{data.articlesAnalyzed}</p>
            <p className="text-xs text-muted-foreground">
              Articles Analyzed ({data.timeWindow})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */

export function AdminMarket() {
  const [selectedTopic, setSelectedTopic] = useState<MarketAsset | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const {
    data: marketData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<{ success: boolean; data: MarketResponse }>({
    queryKey: ["admin", "market"],
    queryFn: async () => {
      const res = await fetch(`${WORKER_BASE}/api/market`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Market API error: ${res.status}`);
      return (await res.json()) as { success: boolean; data: MarketResponse };
    },
    staleTime: MARKET_STALE_TIME,
    refetchInterval: MARKET_REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
  });

  const { data: personsData } = useQuery({
    queryKey: ["admin", "persons", "all"],
    queryFn: () =>
      adminApi.listPersons({ limit: MAX_PERSONS, status: "active" }),
  });

  const persons: PersonDTO[] = personsData?.data ?? [];
  const market = marketData?.data;

  const filteredTopics = useMemo(() => {
    if (!market) return [];
    let topics = market.assets;

    if (filters.categories.length > 0) {
      topics = topics.filter((t) =>
        t.categories?.some((c) => filters.categories.includes(c))
      );
    }

    if (filters.sentiment) {
      topics = topics.filter((t) => t.sentiment === filters.sentiment);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      topics = topics.filter(
        (t) =>
          t.topic.toLowerCase().includes(q) ||
          t.recentHeadlines.some((h) => h.toLowerCase().includes(q))
      );
    }

    return topics;
  }, [market, filters]);

  const handleTopicClick = useCallback((topic: MarketAsset) => {
    setSelectedTopic(topic);
    setSheetOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetch(`${WORKER_BASE}/api/market/refresh`, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    refetch();
  }, [refetch]);

  const queryClient = useQueryClient();
  const handlePersonAdded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "persons"] });
  }, [queryClient]);

  return (
    <>
      <Header>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Market Intelligence</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {market && (
            <span className="text-xs text-muted-foreground">
              Updated {formatTimeAgo(market.fetchedAt)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 pt-6 text-destructive">
              <TrendingDown className="h-5 w-5" />
              <p className="text-sm">
                Failed to load market data. Please try refreshing.
              </p>
            </CardContent>
          </Card>
        )}

        {market && (
          <div className="space-y-6">
            <SummaryStats data={market} />

            <FilterBar
              filters={filters}
              onChange={setFilters}
              articleCount={market.articlesAnalyzed}
            />

            {filteredTopics.length === 0 && hasActiveFilters(filters) && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Filter className="mb-2 h-8 w-8" />
                  <p className="text-sm">
                    No topics match the current filters.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {filteredTopics.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTopics.map((topic) => (
                  <TopicCard
                    key={topic.topic}
                    topic={topic}
                    fetchedAt={market.fetchedAt}
                    onClick={() => handleTopicClick(topic)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Main>

      <MarketDetailSheet
        topic={selectedTopic}
        fetchedAt={market?.fetchedAt ?? new Date().toISOString()}
        persons={persons}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onPersonAdded={handlePersonAdded}
      />
    </>
  );
}
