import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslate } from "@/hooks/use-translate";
import { neptuApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { HighlightedText } from "./highlighted-text";

const interestConfig: Record<
  string,
  { icon: string; bgColor: string; iconColor: string }
> = {
  career: {
    icon: "💼",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  finance: {
    icon: "💰",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  love: {
    icon: "💕",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  health: {
    icon: "🏃",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  spirituality: {
    icon: "🙏",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  family: {
    icon: "👨‍👩‍👧‍👦",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  travel: {
    icon: "✈️",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  creativity: {
    icon: "🎨",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  education: {
    icon: "📚",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  friendship: {
    icon: "👋",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  selfgrowth: {
    icon: "🌱",
    bgColor: "bg-lime-100 dark:bg-lime-900/30",
    iconColor: "text-lime-600 dark:text-lime-400",
  },
  mindfulness: {
    icon: "🧘",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  crypto: {
    icon: "🪙",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  fitness: {
    icon: "💪",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
  purpose: {
    icon: "🧭",
    bgColor: "bg-slate-100 dark:bg-slate-900/30",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  balance: {
    icon: "☯️",
    bgColor: "bg-stone-100 dark:bg-stone-900/30",
    iconColor: "text-stone-600 dark:text-stone-400",
  },
  luck: {
    icon: "🍀",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  intimacy: {
    icon: "🔥",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
};

function parseInsights(
  message: string | undefined,
  interest: string
): { affirmation: string; action: string; mainText: string } {
  const defaults: Record<string, { affirmation: string; action: string }> = {
    love: { affirmation: "I AM LOVED", action: "Express gratitude" },
    career: { affirmation: "I AM SUCCESSFUL", action: "Network" },
    health: { affirmation: "I AM VITAL", action: "Move your body" },
    finance: { affirmation: "I AM ABUNDANT", action: "Invest wisely" },
    family: { affirmation: "I AM CONNECTED", action: "Reach out to family" },
    friendship: {
      affirmation: "I AM SUPPORTED",
      action: "Connect with a friend",
    },
    intimacy: { affirmation: "I AM PASSIONATE", action: "Be present and open" },
    spirituality: { affirmation: "I AM ALIGNED", action: "Meditate" },
    mindfulness: { affirmation: "I AM PRESENT", action: "Breathe deeply" },
    selfgrowth: { affirmation: "I AM EVOLVING", action: "Learn something new" },
    purpose: {
      affirmation: "I AM PURPOSEFUL",
      action: "Reflect on your mission",
    },
    balance: { affirmation: "I AM BALANCED", action: "Rest and recharge" },
    creativity: { affirmation: "I AM CREATIVE", action: "Create something" },
    travel: {
      affirmation: "I AM ADVENTUROUS",
      action: "Explore your surroundings",
    },
    fitness: { affirmation: "I AM STRONG", action: "Move your body" },
    education: { affirmation: "I AM WISE", action: "Read or study" },
    luck: { affirmation: "I AM FORTUNATE", action: "Trust your intuition" },
    crypto: { affirmation: "I AM PROSPEROUS", action: "Research the market" },
  };
  const fallback = defaults[interest] || {
    affirmation: "I AM FOCUSED",
    action: "Take action",
  };

  if (!message) return { ...fallback, mainText: "" };

  let affirmation = fallback.affirmation;
  let action = fallback.action;
  const contentLines: string[] = [];

  for (const line of message.split("\n")) {
    if (line.toUpperCase().includes("AFFIRMATION:")) {
      affirmation = line.replace(/AFFIRMATION:/i, "").trim();
    } else if (line.toUpperCase().includes("ACTION:")) {
      action = line.replace(/ACTION:/i, "").trim();
    } else {
      contentLines.push(line);
    }
  }

  return { affirmation, action, mainText: contentLines.join("\n").trim() };
}

export function InterestOracle({
  interest,
  birthDate,
  targetDate,
  language,
}: {
  interest: string;
  birthDate: string;
  targetDate: string;
  language: string;
}) {
  const t = useTranslate();
  const interestName = t(`interest.${interest}`, interest);

  const { data, isLoading } = useQuery({
    queryKey: ["oracle-interest", interest, birthDate, targetDate, language],
    queryFn: () =>
      neptuApi.askOracle(
        `What does my reading say about my ${interest} on ${targetDate}? Focus on practical advice.

Important: When mentioning the affirmation or action word, always wrap them in double quotes like "WORD".

At the end of your response, include these two lines:
AFFIRMATION: [a short powerful affirmation for ${interest}, max 5 words]
ACTION: [one specific action word or phrase for ${interest}, max 3 words]`,
        birthDate,
        targetDate,
        language
      ),
    enabled: !!birthDate,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const insights = parseInsights(data?.message, interest);

  const config = interestConfig[interest] || {
    icon: "✨",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  };

  return (
    <Card className="gap-0 px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            config.bgColor
          )}
        >
          <span className="text-xl">{config.icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight capitalize">
            {interestName} {t("oracle.insight")}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("oracle.guidanceFor")}{" "}
            {format(new Date(targetDate), "MMM d, yyyy")}
          </p>
        </div>
      </div>
      <Separator className="mb-4" />
      <div className="space-y-1.5">
        {(() => {
          if (isLoading) {
            return (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("oracle.analyzing")} {interestName}...
                </p>
              </div>
            );
          }
          if (insights.mainText) {
            return (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <HighlightedText text={insights.mainText} />
              </div>
            );
          }
          return (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("oracle.noInsight")}
              </p>
            </div>
          );
        })()}
      </div>
    </Card>
  );
}
