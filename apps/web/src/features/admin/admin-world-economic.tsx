import type { MarketCategoryDTO } from "@neptu/drizzle-orm";
import type { PersonTag } from "@neptu/shared";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Crown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { adminApi } from "./admin-api";
import { MarketSentimentGauge } from "./world-economic-components";
import { CryptoMarketGrid } from "./world-economic-market-grid";
import {
  type CryptoMarketResponse,
  computeMarketSentiment,
  MAX_PERSONS,
  PP_REFETCH_INTERVAL,
  PP_STALE_TIME,
  WORKER_BASE_URL,
} from "./world-economic-parts";
import { WealthFlowWidget } from "./world-economic-wealth-flow";

/* ── Main Component ──────────────────────────────────── */

export function AdminWorldEconomic() {
  const [activeTab, setActiveTab] = useState<string>("stocks");

  /* Fetch market categories */
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin", "market-categories"],
    queryFn: () => adminApi.listMarketCategories(),
    staleTime: PP_STALE_TIME,
  });

  /* Fetch all persons */
  const { data: figuresData, isLoading: figuresLoading } = useQuery({
    queryKey: ["admin", "persons", "all"],
    queryFn: () =>
      adminApi.listPersons({ limit: MAX_PERSONS, status: "active" }),
    refetchInterval: PP_REFETCH_INTERVAL,
  });

  /* Fetch crypto market data (for Crypto tab) */
  const { data: marketRaw, isLoading: marketLoading } =
    useQuery<CryptoMarketResponse>({
      queryKey: ["crypto-market"],
      queryFn: async () => {
        const url = `${WORKER_BASE_URL}/api/crypto/market`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Market API error: ${res.status}`);
        return (await res.json()) as CryptoMarketResponse;
      },
      refetchInterval: PP_REFETCH_INTERVAL,
      staleTime: PP_STALE_TIME,
      refetchOnWindowFocus: false,
    });

  const categories = categoriesData?.data ?? [];
  const figures = figuresData?.data ?? [];
  const marketCoins = marketRaw?.data ?? [];

  /* Active category data */
  const activeCategory = categories.find((c) => c.slug === activeTab) ?? null;

  /* Filter figures by the active tab's personTags */
  const tabFigures = useMemo(() => {
    if (!activeCategory || figures.length === 0) return figures;
    const tagSet = new Set<PersonTag>(activeCategory.personTags);
    return figures.filter((f) => {
      const fTags = (f.tags ?? []) as PersonTag[];
      return fTags.some((t) => tagSet.has(t));
    });
  }, [figures, activeCategory]);

  /* Sentiment for the filtered tab figures */
  const sentiment = useMemo(
    () => (tabFigures.length > 0 ? computeMarketSentiment(tabFigures) : null),
    [tabFigures]
  );

  const isCryptoTab = activeCategory?.category === "crypto";

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">World Economic</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main>
        <div className="space-y-6">
          {/* Market Category Tabs */}
          {categoriesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading categories...</span>
            </div>
          ) : (
            <MarketCategoryTabs
              categories={categories}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

          {/* Neptu Astrology Sentiment for this tab */}
          {figuresLoading ? (
            <div className="flex h-[120px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading sentiment...
            </div>
          ) : (
            sentiment && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MarketSentimentGauge
                  sentiment={sentiment}
                  isFiltered={tabFigures.length < figures.length}
                  totalCount={figures.length}
                />
              </div>
            )
          )}

          {/* Crypto Market Grid — only visible on Crypto tab */}
          {isCryptoTab && (
            <CryptoMarketGrid coins={marketCoins} isLoading={marketLoading} />
          )}

          {/* Forbes Billionaire Wealth Flow — always visible */}
          <WealthFlowWidget />
        </div>
      </Main>
    </>
  );
}

/* ── Market Category Tabs ────────────────────────────── */

function MarketCategoryTabs({
  categories,
  activeTab,
  onTabChange,
}: {
  categories: MarketCategoryDTO[];
  activeTab: string;
  onTabChange: (slug: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onTabChange(cat.slug)}
          className={cn(
            "rounded-md px-4 py-2 text-xs font-medium transition-colors",
            activeTab === cat.slug
              ? "text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
          style={
            activeTab === cat.slug
              ? { backgroundColor: cat.color ?? "hsl(var(--primary))" }
              : undefined
          }
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
