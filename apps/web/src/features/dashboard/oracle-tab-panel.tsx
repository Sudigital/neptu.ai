import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslate } from "@/hooks/use-translate";
import { Sparkles, Loader2, Bot } from "lucide-react";

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

  return (
    <Card className="gap-0 px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
          <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.oracleInsight", "Today's Oracle")}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("oracle.subtitle", "Your personal Balinese astrology guide")}
          </p>
        </div>
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
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
