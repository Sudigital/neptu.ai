import type { MitraSatruCategory } from "@neptu/shared";

import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  score: number;
  category?: MitraSatruCategory;
}

const categoryColors: Record<MitraSatruCategory, string> = {
  mitra: "bg-emerald-500",
  neutral: "bg-amber-500",
  satru: "bg-red-500",
};

function ScoreBar({ label, score, category }: ScoreBarProps) {
  const barColor = category
    ? categoryColors[category]
    : score >= 70
      ? "bg-emerald-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs sm:text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={cn("h-2 rounded-full transition-all", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface CompatibilityScoresProps {
  scores: {
    frekuensi: number;
    cycles: number;
    traits: number;
    overall: number;
  };
  category: MitraSatruCategory;
  t: (key: string, fallback?: string) => string;
}

export function CompatibilityScores({
  scores,
  category,
  t,
}: CompatibilityScoresProps) {
  return (
    <div className="space-y-3">
      <ScoreBar
        label={t("compatibility.score.frekuensi", "Frekuensi")}
        score={scores.frekuensi}
        category={category}
      />
      <ScoreBar
        label={t("compatibility.score.cycles", "Cycles")}
        score={scores.cycles}
      />
      <ScoreBar
        label={t("compatibility.score.traits", "Traits")}
        score={scores.traits}
      />
      <div className="mt-3 border-t pt-3">
        <ScoreBar
          label={t("compatibility.score.overall", "Overall")}
          score={scores.overall}
          category={category}
        />
      </div>
    </div>
  );
}
