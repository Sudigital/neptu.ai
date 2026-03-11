import type { Peluang, Potensi } from "@neptu/shared";

import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";

import { ComparisonBarChart } from "./comparison-bar-chart";
import { HourlyGrid, SoulRadarChart } from "./dashboard-charts";
import { InterestCarousel } from "./interest-carousel";
import { OracleTabPanel } from "./oracle-tab-panel";

interface DashboardTabContentsProps {
  selectedDate: Date;
  peluang: Peluang | undefined;
  potensi: Potensi | undefined;
  aiLoading: boolean;
  interpretation: string | undefined;
  totalUrip: number | undefined;
  birthDate: string | undefined;
  interests: string[];
  targetDate: string;
  language: string;
  t: (key: string, fallback?: string) => string;
}

export function DashboardTabContents({
  selectedDate,
  peluang,
  potensi,
  aiLoading,
  interpretation,
  totalUrip,
  birthDate,
  interests,
  targetDate,
  language,
  t,
}: DashboardTabContentsProps) {
  return (
    <>
      <TabsContent value="24h" className="mt-2 space-y-4">
        <HourlyGrid selectedDate={selectedDate} peluang={peluang} />
        <Separator />
        <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 md:grid-cols-2">
          <div className="flex min-w-0 flex-col overflow-hidden">
            <h3 className="mb-3 text-sm font-semibold">
              🧠 {t("chart.soulDimensions")}
            </h3>
            <SoulRadarChart peluang={peluang} potensi={potensi} />
          </div>
          <Separator className="md:hidden" />
          <div className="flex min-w-0 flex-col overflow-hidden">
            <h3 className="mb-3 text-sm font-semibold">
              ⚖️ {t("chart.peluangVsPotensi")}
            </h3>
            <ComparisonBarChart peluang={peluang} potensi={potensi} />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="oracle" className="mt-2">
        <OracleTabPanel
          aiLoading={aiLoading}
          interpretation={interpretation}
          totalUrip={totalUrip}
          birthDate={birthDate}
        />
      </TabsContent>
      {interests.length > 0 && (
        <TabsContent value="interests" className="mt-2">
          {birthDate && (
            <InterestCarousel
              interests={interests}
              birthDate={birthDate}
              targetDate={targetDate}
              language={language}
            />
          )}
        </TabsContent>
      )}
    </>
  );
}
