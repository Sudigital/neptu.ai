import { useTranslate } from "@/hooks/use-translate";
import { cn } from "@/lib/utils";
import { isToday, isPast, format } from "date-fns";
import { Sparkles, Calendar as CalendarIcon, Star } from "lucide-react";

type EnergySummary = {
  potensiSummary: string;
  peluangSummary: string;
  alignment: string;
};

type EnergyScoreCardProps = {
  potensiUrip: number;
  peluangUrip: number;
  selectedDate: Date;
  summary?: EnergySummary | null;
};

export function EnergyScoreCard({
  potensiUrip,
  peluangUrip,
  selectedDate,
  summary,
}: EnergyScoreCardProps) {
  const t = useTranslate();
  return (
    <div
      className={cn(
        "rounded-2xl p-6 text-white shadow-xl",
        (() => {
          if (isToday(selectedDate))
            return "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700";
          if (isPast(selectedDate))
            return "bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700";
          return "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700";
        })()
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white/80">
              {(() => {
                if (isToday(selectedDate))
                  return t("dashboard.todaysAlignment");
                if (isPast(selectedDate)) return t("dashboard.pastReading");
                return t("dashboard.futurePrediction");
              })()}
            </p>
            {!isToday(selectedDate) && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {format(selectedDate, "MMM d")}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-4xl font-bold">
            {potensiUrip} / {peluangUrip}
          </h2>
          <p className="mt-2 text-sm text-white/70">
            {t("dashboard.birthEnergy")} /{" "}
            {isToday(selectedDate)
              ? t("dashboard.todayEnergy")
              : format(selectedDate, "MMM d")}
          </p>
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          {(() => {
            if (isToday(selectedDate))
              return <Sparkles className="h-10 w-10 text-white" />;
            if (isPast(selectedDate))
              return <CalendarIcon className="h-10 w-10 text-white" />;
            return <Star className="h-10 w-10 text-white" />;
          })()}
        </div>
      </div>
      {summary && (
        <div className="mt-4 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
          <p className="text-sm text-white/90">{summary.alignment}</p>
        </div>
      )}
    </div>
  );
}
