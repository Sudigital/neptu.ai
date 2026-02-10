import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { InterestOracle } from "./interest-oracle";

const interestMeta: Record<
  string,
  { icon: string; bgColor: string; label: string; tagline: string }
> = {
  love: {
    icon: "💕",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    label: "Love",
    tagline: "Heart connections",
  },
  career: {
    icon: "💼",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Career",
    tagline: "Professional growth",
  },
  health: {
    icon: "🏃",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "Health",
    tagline: "Wellness & vitality",
  },
  finance: {
    icon: "💰",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Finance",
    tagline: "Abundance flow",
  },
  family: {
    icon: "👨‍👩‍👧‍👦",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Family",
    tagline: "Family harmony",
  },
  friendship: {
    icon: "👋",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    label: "Friendship",
    tagline: "Social bonds",
  },
  intimacy: {
    icon: "🔥",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    label: "Intimacy",
    tagline: "Deep connections",
  },
  spirituality: {
    icon: "🙏",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    label: "Spirituality",
    tagline: "Soul alignment",
  },
  mindfulness: {
    icon: "🧘",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    label: "Mindfulness",
    tagline: "Present awareness",
  },
  selfgrowth: {
    icon: "🌱",
    bgColor: "bg-lime-100 dark:bg-lime-900/30",
    label: "Self Growth",
    tagline: "Personal evolution",
  },
  purpose: {
    icon: "🧭",
    bgColor: "bg-slate-100 dark:bg-slate-900/30",
    label: "Purpose",
    tagline: "Life direction",
  },
  balance: {
    icon: "☯️",
    bgColor: "bg-stone-100 dark:bg-stone-900/30",
    label: "Balance",
    tagline: "Inner equilibrium",
  },
  creativity: {
    icon: "🎨",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    label: "Creativity",
    tagline: "Creative expression",
  },
  travel: {
    icon: "✈️",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    label: "Travel",
    tagline: "Exploration energy",
  },
  fitness: {
    icon: "💪",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Fitness",
    tagline: "Physical power",
  },
  education: {
    icon: "📚",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    label: "Education",
    tagline: "Knowledge pursuit",
  },
  luck: {
    icon: "🍀",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Luck",
    tagline: "Fortune alignment",
  },
  crypto: {
    icon: "🪙",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Crypto",
    tagline: "Digital fortune",
  },
};

export function OracleInsightPanel({
  interests,
  birthDate,
  targetDate,
  language,
}: {
  interests: string[];
  birthDate: string;
  targetDate: string;
  language: string;
}) {
  if (!interests || interests.length === 0) {
    return (
      <Card className="py-8 px-4">
        <div className="text-center">
          <span className="text-4xl">🔮</span>
          <h3 className="mt-3 text-base font-semibold">
            No interests selected
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Go to Settings to add your interests and get personalized oracle
            insights.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-left-4 fade-in duration-300">
      {/* Interest Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {interests.map((interest, index) => {
          const meta = interestMeta[interest] || {
            icon: "✨",
            bgColor: "bg-violet-100 dark:bg-violet-900/30",
            label: interest,
            tagline: "Personalized insight",
          };
          return (
            <div
              key={interest}
              className="animate-in slide-in-from-left-4 fade-in duration-300"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "backwards",
              }}
            >
              <Card
                className={cn(
                  "py-3 px-3 gap-0 cursor-default transition-all hover:shadow-md hover:scale-[1.02]",
                  "border",
                )}
              >
                <div className="flex flex-col items-center text-center gap-1">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      meta.bgColor,
                    )}
                  >
                    <span className="text-xl">{meta.icon}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold capitalize mt-1">
                    {meta.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {meta.tagline}
                  </p>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Detailed Oracle for each interest */}
      <div className="space-y-3">
        {interests.map((interest, index) => (
          <div
            key={`oracle-${interest}`}
            className="animate-in slide-in-from-left-4 fade-in duration-300"
            style={{
              animationDelay: `${(interests.length + index) * 50}ms`,
              animationFillMode: "backwards",
            }}
          >
            <InterestOracle
              interest={interest}
              birthDate={birthDate}
              targetDate={targetDate}
              language={language}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
