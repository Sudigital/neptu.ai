import { useTranslate } from "@/hooks/use-translate";
import { isToday, isPast, format } from "date-fns";
import { Sparkles } from "lucide-react";

type DailyOpportunityCardProps = {
  selectedDate: Date;
  diberiHakUntuk?: {
    name?: string;
    description?: string;
  };
};

export function DailyOpportunityCard({
  selectedDate,
  diberiHakUntuk,
}: DailyOpportunityCardProps) {
  const t = useTranslate();
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-semibold">
          {isToday(selectedDate)
            ? t("dashboard.todaysOpportunity")
            : isPast(selectedDate)
              ? `${format(selectedDate, "MMM d")} ${t("dashboard.pastReading")}`
              : `${format(selectedDate, "MMM d")} ${t("dashboard.futurePrediction")}`}
        </span>
      </div>
      <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-3 dark:from-emerald-950/30 dark:to-teal-950/30">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {diberiHakUntuk?.name || t("dashboard.calculating")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {diberiHakUntuk?.description || t("dashboard.opportunityFor")}
        </p>
      </div>
    </div>
  );
}
