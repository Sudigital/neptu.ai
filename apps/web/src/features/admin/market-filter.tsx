import type { MarketCategory, MarketSentiment } from "@neptu/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SENTIMENT_CONFIG,
  MARKET_CATEGORIES,
  MARKET_CATEGORY_CONFIG,
} from "@neptu/shared";
import { Filter, X } from "lucide-react";

/* ── Filter State ────────────────────────────────────── */

export interface FilterState {
  categories: MarketCategory[];
  sentiment: MarketSentiment | null;
  search: string;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  sentiment: null,
  search: "",
};

export function hasActiveFilters(f: FilterState): boolean {
  return f.categories.length > 0 || f.sentiment !== null || f.search.length > 0;
}

/* ── Filter Bar Component ────────────────────────────── */

export function FilterBar({
  filters,
  onChange,
  articleCount,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  articleCount: number;
}) {
  const toggleCategory = (cat: MarketCategory) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: next });
  };

  const toggleSentiment = (s: MarketSentiment) => {
    onChange({ ...filters, sentiment: filters.sentiment === s ? null : s });
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {articleCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {articleCount} articles
              </Badge>
            )}
          </div>
          {hasActiveFilters(filters) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MARKET_CATEGORIES.map((cat) => {
            const cfg = MARKET_CATEGORY_CONFIG[cat];
            const active = filters.categories.includes(cat);
            return (
              <Button
                key={cat}
                variant={active ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                style={
                  active
                    ? { backgroundColor: cfg.color, borderColor: cfg.color }
                    : { borderColor: `${cfg.color}40`, color: cfg.color }
                }
                onClick={() => toggleCategory(cat)}
              >
                {cfg.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["bullish", "bearish", "neutral"] as const).map((s) => {
            const cfg = SENTIMENT_CONFIG[s];
            const active = filters.sentiment === s;
            return (
              <Button
                key={s}
                variant={active ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                style={
                  active
                    ? { backgroundColor: cfg.color, borderColor: cfg.color }
                    : { borderColor: `${cfg.color}40`, color: cfg.color }
                }
                onClick={() => toggleSentiment(s)}
              >
                {cfg.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
