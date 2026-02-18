import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { InterestOracle } from "./interest-oracle";

export function InterestCarousel({
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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  if (interests.length === 0) return null;

  return (
    <Carousel setApi={setApi} className="w-full">
      <CarouselContent>
        {interests.map((interest) => (
          <CarouselItem key={interest}>
            <InterestOracle
              interest={interest}
              birthDate={birthDate}
              targetDate={targetDate}
              language={language}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="top-10 -left-3 sm:-left-5" />
      <CarouselNext className="top-10 -right-3 sm:-right-5" />

      <div className="mt-3 flex items-center justify-center gap-1">
        {interests.map((interest, index) => (
          <button
            key={interest}
            type="button"
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              current === index
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to ${interest}`}
          />
        ))}
      </div>
    </Carousel>
  );
}
