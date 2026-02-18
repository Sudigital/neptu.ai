import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslate } from "@/hooks/use-translate";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, Bot, ALargeSmall } from "lucide-react";
import { useState } from "react";

import { HighlightedText } from "./highlighted-text";

interface OracleTabPanelProps {
  aiLoading: boolean;
  interpretation?: string;
}

export function OracleTabPanel({
  aiLoading,
  interpretation,
}: OracleTabPanelProps) {
  const t = useTranslate();
  const [isLargeFont, setIsLargeFont] = useState(false);

  return (
    <Card className="gap-0 px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
          <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold sm:text-sm">
            {t("dashboard.oracleInsight", "Today's Oracle")}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {t("oracle.subtitle", "Your personal Balinese astrology guide")}
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          className={cn(
            "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted",
            isLargeFont && "bg-muted text-foreground"
          )}
          onClick={() => setIsLargeFont((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsLargeFont((prev) => !prev);
            }
          }}
          title={isLargeFont ? "Smaller text" : "Larger text"}
        >
          <ALargeSmall className="h-4 w-4" />
        </span>
      </div>
      <Separator className="mb-4" />
      {(() => {
        if (aiLoading) {
          return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dashboard.consultingOracle", "Consulting the Oracle...")}
              </p>
            </div>
          );
        }
        if (interpretation) {
          return (
            <div
              className={cn(
                "prose dark:prose-invert max-w-none leading-relaxed",
                isLargeFont ? "prose-sm" : "prose-xs text-xs"
              )}
            >
              <HighlightedText text={interpretation} />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-violet-100 p-4 dark:bg-violet-900/30">
              <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {t(
                "dashboard.selectDatePrompt",
                "Select a date to receive personalized guidance based on Balinese astrology and your birth chart."
              )}
            </p>
          </div>
        );
      })()}
    </Card>
  );
}
