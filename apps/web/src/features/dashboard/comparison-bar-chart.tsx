import { Moon, Sun } from "lucide-react";
import { CartesianGrid, XAxis, YAxis, Bar, BarChart } from "recharts";
import { Card } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ReadingLike } from "./dashboard-charts";

const barChartConfig = {
  peluang: { label: "Peluang", color: "oklch(0.685 0.169 237)" },
  potensi: { label: "Potensi", color: "oklch(0.769 0.188 70.08)" },
} satisfies ChartConfig;

export function ComparisonBarChart({
  peluang,
  potensi,
}: {
  peluang: ReadingLike & {
    total_urip?: number;
    c24_urip?: number;
    full_urip?: number;
  };
  potensi: ReadingLike & {
    total_urip?: number;
    c24_urip?: number;
    full_urip?: number;
  };
}) {
  const t = useTranslate();
  const metrics = [
    {
      key: t("chart.totalUrip"),
      peluang: peluang?.total_urip ?? 0,
      potensi: potensi?.total_urip ?? 0,
    },
    {
      key: t("chart.c24Urip"),
      peluang: peluang?.c24_urip ?? 0,
      potensi: potensi?.c24_urip ?? 0,
    },
    {
      key: t("chart.fullUrip"),
      peluang: peluang?.full_urip ?? 0,
      potensi: potensi?.full_urip ?? 0,
    },
    {
      key: t("dashboard.cipta"),
      peluang: peluang?.cipta?.value ?? 0,
      potensi: potensi?.cipta?.value ?? 0,
    },
    {
      key: t("dashboard.rasa"),
      peluang: peluang?.rasa?.value ?? 0,
      potensi: potensi?.rasa?.value ?? 0,
    },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-2">
      <ChartContainer
        config={barChartConfig}
        className="!aspect-auto h-[200px] sm:h-[240px] w-full min-w-0"
      >
        <BarChart
          accessibilityLayer
          data={metrics}
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            fontSize={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={2}
            fontSize={10}
            width={32}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="peluang"
            name="Peluang"
            fill="oklch(0.685 0.169 237)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="potensi"
            name="Potensi"
            fill="oklch(0.769 0.188 70.08)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          {t("chart.peluang")} ({t("chart.today")})
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {t("chart.potensi")} ({t("chart.birth")})
        </span>
      </div>

      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        <Card className="flex flex-col border-sky-200/50 dark:border-sky-800/50 bg-gradient-to-br from-sky-50/50 to-blue-50/50 dark:from-sky-950/20 dark:to-blue-950/20 p-3">
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1 mb-1.5">
            <Moon className="h-3 w-3" /> {t("chart.peluang")}
          </p>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("chart.totalUrip")}
              </span>
              <span className="font-bold text-sky-700 dark:text-sky-300">
                {peluang?.total_urip ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("chart.c24Urip")}
              </span>
              <span className="font-semibold">{peluang?.c24_urip ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("chart.fullUrip")}
              </span>
              <span className="font-semibold">{peluang?.full_urip ?? 0}</span>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 p-3">
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 mb-1.5">
            <Sun className="h-3 w-3" /> {t("chart.potensi")}
          </p>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("chart.totalUrip")}
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {potensi?.total_urip ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("chart.c24Urip")}
              </span>
              <span className="font-semibold">{potensi?.c24_urip ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("chart.fullUrip")}
              </span>
              <span className="font-semibold">{potensi?.full_urip ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
