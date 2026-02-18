import type { CompatibilityResult } from "@neptu/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HighlightedText } from "@/features/dashboard/highlighted-text";
import { neptuApi } from "@/lib/api";
import { useSettingsStore } from "@/stores/settings-store";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

export function AiSummaryCard({
  reading,
  t,
}: {
  reading: CompatibilityResult;
  t: (key: string, fallback?: string) => string;
}) {
  const { language } = useSettingsStore();

  const {
    mutate: fetchSummary,
    data: aiResult,
    isPending,
    error,
  } = useMutation({
    mutationFn: () =>
      neptuApi.getCompatibilityInterpretation(
        reading.person1.date,
        reading.person2.date,
        language
      ),
  });

  const message = aiResult?.message;

  return (
    <Card className="h-full gap-0 border-violet-200/50 px-5 py-5 dark:border-violet-800/50">
      {/* Header — same pattern as InterestOracle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
          <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            {t("compatibility.aiSummary")}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("compatibility.aiSummarySubtitle", "Balinese wisdom analysis")}
          </p>
        </div>
      </div>
      <Separator className="mb-4" />

      {/* Content */}
      <div className="space-y-1.5">
        {!message && !isPending && !error && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="rounded-full bg-violet-100 p-3 dark:bg-violet-900/30">
              <Sparkles className="h-6 w-6 text-violet-500 dark:text-violet-400" />
            </div>
            <p className="max-w-[200px] text-xs text-muted-foreground">
              {t("compatibility.aiSummaryHint")}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchSummary()}
              className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {t("compatibility.getAiSummary")}
            </Button>
          </div>
        )}

        {isPending && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("compatibility.aiLoading")}
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-xs text-destructive">
              {t("compatibility.aiError")}
            </p>
            <Button size="sm" variant="outline" onClick={() => fetchSummary()}>
              {t("compatibility.retry")}
            </Button>
          </div>
        )}

        {message && (
          <div className="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed">
            <HighlightedText text={message} />
          </div>
        )}
      </div>
    </Card>
  );
}
