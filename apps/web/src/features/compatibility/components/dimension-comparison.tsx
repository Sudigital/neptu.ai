import type { DimensionComparison } from "@neptu/shared";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface DimensionComparisonListProps {
  dimensions: DimensionComparison[];
  t: (key: string, fallback?: string) => string;
}

export function DimensionComparisonList({
  dimensions,
  t,
}: DimensionComparisonListProps) {
  return (
    <div className="space-y-2">
      {dimensions.map((dim) => {
        const p1Translated = t(
          `wariga.${dim.dimension.toLowerCase()}.${dim.person1Value}`,
          dim.person1Value
        );
        const p2Translated = t(
          `wariga.${dim.dimension.toLowerCase()}.${dim.person2Value}`,
          dim.person2Value
        );

        return (
          <div
            key={dim.dimension}
            className={cn(
              "flex items-center justify-between rounded-lg border p-2.5 sm:p-3",
              dim.isMatch
                ? "border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                : "border-muted bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2">
              {dim.isMatch ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <X className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="text-xs font-medium sm:text-sm">
                {dim.dimension}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
              <span>{p1Translated}</span>
              <span className="text-muted-foreground/50">↔</span>
              <span>{p2Translated}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
