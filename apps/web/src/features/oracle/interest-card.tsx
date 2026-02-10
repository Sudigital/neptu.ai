import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { neptuApi } from "@/lib/api";
import { HighlightedText } from "../dashboard/highlighted-text";

const interestConfig: Record<
  string,
  {
    icon: string;
    bgColor: string;
    borderColor: string;
    label: string;
    tagline: string;
  }
> = {
  love: {
    icon: "💕",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800/50",
    label: "Love",
    tagline: "Heart connections & romance",
  },
  career: {
    icon: "💼",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/50",
    label: "Career",
    tagline: "Professional growth & success",
  },
  health: {
    icon: "🏃",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800/50",
    label: "Health",
    tagline: "Wellness & vitality",
  },
  finance: {
    icon: "💰",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    label: "Finance",
    tagline: "Abundance & prosperity",
  },
  family: {
    icon: "👨‍👩‍👧‍👦",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800/50",
    label: "Family",
    tagline: "Family harmony & bonds",
  },
  friendship: {
    icon: "👋",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800/50",
    label: "Friendship",
    tagline: "Social bonds & community",
  },
  intimacy: {
    icon: "🔥",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800/50",
    label: "Intimacy",
    tagline: "Deep connections & passion",
  },
  spirituality: {
    icon: "🙏",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800/50",
    label: "Spirituality",
    tagline: "Soul alignment & inner peace",
  },
  mindfulness: {
    icon: "🧘",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800/50",
    label: "Mindfulness",
    tagline: "Present awareness & calm",
  },
  selfgrowth: {
    icon: "🌱",
    bgColor: "bg-lime-50 dark:bg-lime-950/30",
    borderColor: "border-lime-200 dark:border-lime-800/50",
    label: "Self Growth",
    tagline: "Personal evolution & learning",
  },
  purpose: {
    icon: "🧭",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-slate-200 dark:border-slate-800/50",
    label: "Purpose",
    tagline: "Life direction & meaning",
  },
  balance: {
    icon: "☯️",
    bgColor: "bg-stone-50 dark:bg-stone-950/30",
    borderColor: "border-stone-200 dark:border-stone-800/50",
    label: "Balance",
    tagline: "Inner equilibrium & harmony",
  },
  creativity: {
    icon: "🎨",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-800/50",
    label: "Creativity",
    tagline: "Creative expression & art",
  },
  travel: {
    icon: "✈️",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800/50",
    label: "Travel",
    tagline: "Exploration & adventure",
  },
  fitness: {
    icon: "💪",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800/50",
    label: "Fitness",
    tagline: "Physical power & strength",
  },
  education: {
    icon: "📚",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800/50",
    label: "Education",
    tagline: "Knowledge & wisdom pursuit",
  },
  luck: {
    icon: "🍀",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    label: "Luck",
    tagline: "Fortune & serendipity",
  },
  crypto: {
    icon: "🪙",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800/50",
    label: "Crypto",
    tagline: "Digital fortune & markets",
  },
};

const defaultInsights: Record<string, { affirmation: string; action: string }> =
  {
    love: { affirmation: "I AM LOVED", action: "Express gratitude" },
    career: { affirmation: "I AM SUCCESSFUL", action: "Network" },
    health: { affirmation: "I AM VITAL", action: "Move your body" },
    finance: { affirmation: "I AM ABUNDANT", action: "Invest wisely" },
    family: { affirmation: "I AM CONNECTED", action: "Reach out to family" },
    friendship: {
      affirmation: "I AM SUPPORTED",
      action: "Connect with a friend",
    },
    intimacy: {
      affirmation: "I AM PASSIONATE",
      action: "Be present and open",
    },
    spirituality: { affirmation: "I AM ALIGNED", action: "Meditate" },
    mindfulness: { affirmation: "I AM PRESENT", action: "Breathe deeply" },
    selfgrowth: {
      affirmation: "I AM EVOLVING",
      action: "Learn something new",
    },
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
    luck: {
      affirmation: "I AM FORTUNATE",
      action: "Trust your intuition",
    },
    crypto: {
      affirmation: "I AM PROSPEROUS",
      action: "Research the market",
    },
  };

function parseInsights(
  message: string | undefined,
  interest: string,
): { affirmation: string; action: string; mainText: string } {
  const fallback = defaultInsights[interest] || {
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

export function InterestCard({
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
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
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
        language,
      ),
    enabled: !!birthDate,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });

  const insights = parseInsights(data?.message, interest);
  const config = interestConfig[interest] || {
    icon: "✨",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800/50",
    label: interest,
    tagline: "Personalized oracle insight",
  };

  return (
    <>
      <Card
        className={cn(
          "py-4 px-4 gap-0 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border",
          config.bgColor,
          config.borderColor,
        )}
        onClick={() => {
          if (!isLoading) setDialogOpen(true);
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              config.bgColor,
              "ring-1 ring-black/5 dark:ring-white/10",
            )}
          >
            <span className="text-2xl">{config.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold capitalize">{config.label}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {config.tagline}
            </p>
            {isLoading ? (
              <div className="flex items-center gap-1.5 mt-2">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  Consulting oracle...
                </span>
              </div>
            ) : insights.affirmation ? (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-foreground/80 truncate">
                  ✨ {insights.affirmation}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  → {insights.action}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              <span className="capitalize">{config.label} Insight</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Affirmation & Action */}
            <div className="grid grid-cols-2 gap-2">
              <div
                className={cn(
                  "rounded-lg p-3 border",
                  config.bgColor,
                  config.borderColor,
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Affirmation
                </p>
                <p className="text-sm font-bold">{insights.affirmation}</p>
              </div>
              <div
                className={cn(
                  "rounded-lg p-3 border",
                  config.bgColor,
                  config.borderColor,
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Action
                </p>
                <p className="text-sm font-bold">{insights.action}</p>
              </div>
            </div>

            {/* Full Oracle Text */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Analyzing {config.label}...
                </p>
              </div>
            ) : insights.mainText ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <HighlightedText text={insights.mainText} />
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No specific insight available at this time.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Get Insight
                </Button>
              </div>
            )}

            {/* Refresh */}
            {insights.mainText && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5 mr-1.5",
                      isLoading && "animate-spin",
                    )}
                  />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
