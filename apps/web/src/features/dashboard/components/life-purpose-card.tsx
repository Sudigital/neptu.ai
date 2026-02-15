import { useTranslate } from "@/hooks/use-translate";
import { Star } from "lucide-react";

type LifePurposeCardProps = {
  lahirUntuk?: {
    name?: string;
    description?: string;
  };
};

export function LifePurposeCard({ lahirUntuk }: LifePurposeCardProps) {
  const t = useTranslate();
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-semibold">
          {t("dashboard.yourLifePurpose")}
        </span>
      </div>
      <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-3 dark:from-purple-950/30 dark:to-pink-950/30">
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
          {lahirUntuk?.name || t("dashboard.calculating")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {lahirUntuk?.description || t("dashboard.yourLifePurpose")}
        </p>
      </div>
    </div>
  );
}
