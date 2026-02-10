import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="sticky top-0 z-10 bg-background pb-2 pt-1">
      <div className="flex items-center gap-1">
        {showArrows && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0",
              !canScrollLeft && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div
          ref={scrollRef}
          className="overflow-x-auto flex-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <TabsList className="w-max">
            <TabsTrigger value="general" className="gap-1">
              <span>✨</span>
              {t("dashboard.general")}
            </TabsTrigger>
            {interests.map((interest: string) => (
              <TabsTrigger key={interest} value={interest} className="gap-1">
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
              "h-8 w-8 shrink-0",
              !canScrollRight && "opacity-50 cursor-not-allowed",
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
