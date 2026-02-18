import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Sparkles, Sun } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const icons: Record<string, string> = {
  love: "💕",
  career: "💼",
  health: "🏃",
  finance: "💰",
  family: "👨‍👩‍👧‍👦",
  friendship: "👋",
  intimacy: "🔥",
  spirituality: "🙏",
  mindfulness: "🧘",
  selfgrowth: "🌱",
  purpose: "🧭",
  balance: "☯️",
  creativity: "🎨",
  travel: "✈️",
  fitness: "💪",
  education: "📚",
  luck: "🍀",
  crypto: "🪙",
};

const labels: Record<string, string> = {
  love: "Love",
  career: "Career",
  health: "Health",
  finance: "Finance",
  family: "Family",
  friendship: "Friendship",
  intimacy: "Intimacy",
  spirituality: "Spirituality",
  mindfulness: "Mindfulness",
  selfgrowth: "Self Growth",
  purpose: "Purpose",
  balance: "Balance",
  creativity: "Creativity",
  travel: "Travel",
  fitness: "Fitness",
  education: "Education",
  luck: "Luck",
  crypto: "Crypto",
};

export function ScrollableTabs({
  interests,
  t,
}: {
  interests: string[];
  t: (key: string, fallback?: string) => string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (el) {
      const scrollAmount = 150;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const showArrows = canScrollLeft || canScrollRight;

  return (
    <div className="sticky top-0 z-10 bg-background pt-1 pb-2">
      <div className="flex items-center gap-1">
        {showArrows && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-8 shrink-0",
              !canScrollLeft && "cursor-not-allowed opacity-50"
            )}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div ref={scrollRef} className="flex-1 overflow-x-hidden">
          <TabsList className="w-max">
            <TabsTrigger value="24h" className="gap-1">
              <span>🕐</span>
              {t("dashboard.24h", "24h Energy")}
            </TabsTrigger>
            {interests.map((interest: string) => (
              <TabsTrigger key={interest} value={interest} className="gap-1">
                <span>{icons[interest] || "✨"}</span>
                {labels[interest] || interest}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {showArrows && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-8 shrink-0",
              !canScrollRight && "cursor-not-allowed opacity-50"
            )}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ScrollableTabsList({
  interests,
  t,
  showPotensiTab = false,
  className,
}: {
  interests: string[];
  t: (key: string, fallback?: string) => string;
  showPotensiTab?: boolean;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (el) {
      el.scrollBy({
        left: direction === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  const showArrows = canScrollLeft || canScrollRight;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showArrows && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-8 shrink-0",
            !canScrollLeft && "cursor-not-allowed opacity-50"
          )}
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      <div ref={scrollRef} className="flex-1 overflow-x-hidden">
        <TabsList className="w-max">
          {showPotensiTab && (
            <TabsTrigger value="potensi-peluang" className="gap-1">
              <Sun className="h-3.5 w-3.5" />
              {t("dashboard.potensiPeluang", "Potensi & Peluang")}
            </TabsTrigger>
          )}
          <TabsTrigger value="24h" className="gap-1">
            <span>🕐</span>
            {t("chart.energyCharts", "Energy & Charts")}
          </TabsTrigger>
          <TabsTrigger value="oracle" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {t("nav.oracleInsight")}
          </TabsTrigger>
          {interests.map((interest: string) => (
            <TabsTrigger
              key={interest}
              value={`interest-${interest}`}
              className="gap-1"
            >
              <span>{icons[interest] || "✨"}</span>
              {t(`interest.${interest}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {showArrows && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-8 shrink-0",
            !canScrollRight && "cursor-not-allowed opacity-50"
          )}
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
