import type { CompatibilityResult } from "@neptu/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="h-full border-violet-200/50 dark:border-violet-800/50">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <CardTitle className="text-sm">
            {t("compatibility.aiSummary")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-4 pb-4">
        {!message && !isPending && !error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
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
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            <p className="text-xs text-muted-foreground">
              {t("compatibility.aiLoading")}
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-xs text-destructive">
              {t("compatibility.aiError")}
            </p>
            <Button size="sm" variant="outline" onClick={() => fetchSummary()}>
              {t("compatibility.retry")}
            </Button>
          </div>
        )}

        {message && (
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {message.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
