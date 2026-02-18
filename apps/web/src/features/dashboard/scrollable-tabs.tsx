import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Heart, Sparkles, Sun } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

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
          {interests.length > 0 && (
            <TabsTrigger value="interests" className="gap-1">
              <Heart className="h-3.5 w-3.5" />
              {t("nav.interests", "Interests")}
            </TabsTrigger>
          )}
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
