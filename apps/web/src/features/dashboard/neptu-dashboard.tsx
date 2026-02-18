import { Logo } from "@/assets/logo";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useIsBelowLg } from "@/hooks/use-mobile";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { neptuApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { format, isToday, isPast, addDays, subDays } from "date-fns";
import {
  Calendar as CalendarIcon,
  LayoutDashboard,
  Sparkles,
  Sun,
  Moon,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

import { ComparisonBarChart } from "./comparison-bar-chart";
import { HourlyGrid, SoulRadarChart } from "./dashboard-charts";
import { DashboardHeader } from "./dashboard-header";
import { InterestCarousel } from "./interest-carousel";
import { OracleTabPanel } from "./oracle-tab-panel";
import { ReadingDetailCard } from "./reading-detail-card";
import { ScrollableTabsList } from "./scrollable-tabs";

export function Dashboard() {
  const {
    walletAddress,
    hasWallet,
    hasBirthDate,
    user,
    isLoading: userLoading,
  } = useUser();
  const t = useTranslate();
  const { language } = useSettingsStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobileLayout = useIsBelowLg();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const interests = useMemo(() => user?.interests || [], [user?.interests]);
  const targetDateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: aiInterpretation, isLoading: aiLoading } = useQuery({
    queryKey: [
      "ai-interpretation",
      walletAddress,
      targetDateStr,
      user?.birthDate,
      language,
    ],
    queryFn: () =>
      neptuApi.getDateInterpretation(
        user?.birthDate || "",
        targetDateStr,
        language
      ),
    enabled: !!user?.birthDate && !!import.meta.env.VITE_WORKER_URL,
    retry: false,
    staleTime: 1000 * 60 * 30,
  });

  const topNav = [
    {
      title: t("nav.today"),
      href: "/dashboard",
      isActive: true,
      disabled: false,
    },
    {
      title: t("nav.compatibility"),
      href: "/compatibility",
      isActive: false,
      disabled: false,
    },
    {
      title: t("nav.docs"),
      href: "https://docs.neptu.sudigital.com",
      isActive: false,
      disabled: false,
      external: true,
    },
  ];

  const {
    data: readingData,
    isLoading: readingLoading,
    error: readingError,
  } = useQuery({
    queryKey: ["reading", walletAddress, targetDateStr],
    queryFn: () => neptuApi.getReading(walletAddress!, targetDateStr),
    enabled: !!walletAddress && !!user?.birthDate,
    retry: false,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if ((hasWallet || walletAddress) && !hasBirthDate && !userLoading) {
      navigate({ to: "/settings" });
    }
  }, [hasWallet, walletAddress, hasBirthDate, userLoading, navigate]);

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Logo className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if ((hasWallet || walletAddress) && !hasBirthDate) {
    return null;
  }

  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));

  const getReadingSummary = () => {
    if (!readingData?.reading) return null;
    const { potensi, peluang } = readingData.reading;
    if (!potensi || !peluang) return null;
    const potensiName = t(
      `wariga.lahirUntuk.${potensi.lahir_untuk?.name}`,
      potensi.lahir_untuk?.name || potensi.frekuensi?.name || ""
    );
    const peluangName = t(
      `wariga.lahirUntuk.${peluang.diberi_hak_untuk?.name}`,
      peluang.diberi_hak_untuk?.name || peluang.frekuensi?.name || ""
    );
    const potensiDesc = t(
      `wariga.lahirUntukDesc.${potensi.lahir_untuk?.description}`,
      potensi.lahir_untuk?.description || ""
    );
    const peluangDesc = t(
      `wariga.lahirUntukDesc.${peluang.diberi_hak_untuk?.description}`,
      peluang.diberi_hak_untuk?.description || ""
    );
    const actionName = t(
      `wariga.tindakan.${peluang.tindakan?.name?.replace(/\s+/g, "_")}`,
      peluang.tindakan?.name || "mindfulness"
    );
    return {
      potensiSummary: t("dashboard.potensiSummary")
        .replace("{name}", potensiName)
        .replace("{description}", potensiDesc)
        .replace("{wuku}", potensi.wuku?.name || "")
        .replace("{totalUrip}", String(potensi.total_urip ?? "")),
      peluangSummary: t("dashboard.peluangSummary")
        .replace("{name}", peluangName)
        .replace("{description}", peluangDesc)
        .replace("{action}", actionName),
      alignment:
        potensi.frekuensi?.name === peluang.frekuensi?.name
          ? `✨ ${t("dashboard.perfectAlignment")}`
          : t("dashboard.energyComplements")
              .replace("{peluang}", peluangName)
              .replace("{potensi}", potensiName),
    };
  };
  const readingSummary = getReadingSummary();
  const reading = readingData?.reading;

  const dateNavigation = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={goToPreviousDay}
        className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 flex-1 justify-center text-sm font-medium sm:h-10",
              !isToday(selectedDate) &&
                "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
            )}
          >
            <CalendarIcon className="mr-1.5 h-4 w-4 sm:mr-2" />
            {format(selectedDate, "MMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={goToNextDay}
        className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const alignmentHeader = (
    <div
      className={cn(
        "rounded-xl p-4 text-white shadow-xl sm:rounded-2xl sm:p-6",
        isToday(selectedDate)
          ? "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"
          : isPast(selectedDate)
            ? "bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700"
            : "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-white/80 sm:text-sm">
              {isToday(selectedDate)
                ? t("dashboard.todaysAlignment")
                : isPast(selectedDate)
                  ? t("dashboard.pastReading")
                  : t("dashboard.futurePrediction")}
            </p>
            {!isToday(selectedDate) && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {format(selectedDate, "MMM d")}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-bold sm:text-4xl">
            {reading?.potensi?.total_urip ?? 0} /{" "}
            {reading?.peluang?.total_urip ?? 0}
          </h2>
          <p className="mt-1 text-xs text-white/70 sm:mt-2 sm:text-sm">
            {t("dashboard.birthEnergy")} /{" "}
            {isToday(selectedDate)
              ? t("dashboard.todayEnergy")
              : format(selectedDate, "MMM d")}
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm sm:h-20 sm:w-20">
          {isToday(selectedDate) ? (
            <Sparkles className="h-7 w-7 text-white sm:h-10 sm:w-10" />
          ) : isPast(selectedDate) ? (
            <CalendarIcon className="h-7 w-7 text-white sm:h-10 sm:w-10" />
          ) : (
            <Star className="h-7 w-7 text-white sm:h-10 sm:w-10" />
          )}
        </div>
      </div>
      {readingSummary && (
        <div className="mt-3 rounded-lg bg-white/10 p-2.5 backdrop-blur-sm sm:mt-4 sm:rounded-xl sm:p-3">
          <p className="text-xs text-white/90 sm:text-sm">
            {readingSummary.alignment}
          </p>
        </div>
      )}
    </div>
  );

  const readingCards = (
    <div className="grid grid-cols-1 gap-2 sm:gap-3">
      <ReadingDetailCard
        label={t("dashboard.peluang")}
        subtitle={t("dashboard.peluang.subtitle")}
        reading={reading?.peluang}
        icon={
          <Moon className="h-3 w-3 text-sky-600 sm:h-3.5 sm:w-3.5 dark:text-sky-400" />
        }
        totalUrip={reading?.peluang?.total_urip || 0}
        borderClass="border-sky-200/50 dark:border-sky-800/50"
        bgClass="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30"
        labelColorClass="text-sky-700 dark:text-sky-300"
        subtitleColorClass="text-sky-600/70 dark:text-sky-400/70"
        uripColorClass="text-sky-600 dark:text-sky-400"
        iconBgClass="bg-sky-500/20"
        dividerClass="border-sky-200/50 dark:border-sky-800/50"
        t={t}
        warigaPrefix="wariga.lahirUntuk"
      />
      <ReadingDetailCard
        label={t("dashboard.potensi")}
        subtitle={t("dashboard.potensi.subtitle")}
        reading={reading?.potensi}
        icon={
          <Sun className="h-3 w-3 text-amber-600 sm:h-3.5 sm:w-3.5 dark:text-amber-400" />
        }
        totalUrip={reading?.potensi?.total_urip || 0}
        borderClass="border-amber-200/50 dark:border-amber-800/50"
        bgClass="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
        labelColorClass="text-amber-700 dark:text-amber-300"
        subtitleColorClass="text-amber-600/70 dark:text-amber-400/70"
        uripColorClass="text-amber-600 dark:text-amber-400"
        iconBgClass="bg-amber-500/20"
        dividerClass="border-amber-200/50 dark:border-amber-800/50"
        t={t}
        warigaPrefix="wariga.lahirUntuk"
      />
    </div>
  );

  const tabContents = (
    <>
      <TabsContent value="24h" className="mt-2 space-y-4">
        <HourlyGrid selectedDate={selectedDate} peluang={reading?.peluang} />
        <Separator />
        <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 md:grid-cols-2">
          <div className="flex min-w-0 flex-col overflow-hidden">
            <h3 className="mb-3 text-sm font-semibold">
              🧠 {t("chart.soulDimensions")}
            </h3>
            <SoulRadarChart
              peluang={reading?.peluang}
              potensi={reading?.potensi}
            />
          </div>
          <Separator className="md:hidden" />
          <div className="flex min-w-0 flex-col overflow-hidden">
            <h3 className="mb-3 text-sm font-semibold">
              ⚖️ {t("chart.peluangVsPotensi")}
            </h3>
            <ComparisonBarChart
              peluang={reading?.peluang}
              potensi={reading?.potensi}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="oracle" className="mt-2">
        <OracleTabPanel
          aiLoading={aiLoading}
          interpretation={aiInterpretation?.interpretation}
        />
      </TabsContent>
      {interests.length > 0 && (
        <TabsContent value="interests" className="mt-2">
          {user?.birthDate && (
            <InterestCarousel
              interests={interests}
              birthDate={user.birthDate}
              targetDate={targetDateStr}
              language={language}
            />
          )}
        </TabsContent>
      )}
    </>
  );

  if (!hasWallet && !walletAddress) {
    return (
      <>
        <DashboardHeader topNav={topNav} t={t} />
        <Main>
          <div className="flex h-[50vh] items-center justify-center">
            <Card className="w-full max-w-md px-6 py-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold tracking-tight">
                  {t("dashboard.connectWallet")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.connectWalletDesc")}
                </p>
              </div>
            </Card>
          </div>
        </Main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader topNav={topNav} />

      <Main>
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <LayoutDashboard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {t("dashboard.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isToday(selectedDate)
                  ? t("dashboard.subtitle.today")
                  : isPast(selectedDate)
                    ? t("dashboard.subtitle.past")
                    : t("dashboard.subtitle.future")}
              </p>
            </div>
          </div>
        </div>

        {readingLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2 text-muted-foreground">
                {t("dashboard.calculatingReading")}
              </p>
            </div>
          </div>
        ) : readingError ? (
          <Card className="mx-auto max-w-md px-6 py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold tracking-tight text-destructive">
                {t("dashboard.error")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.failedToLoad")}
              </p>
            </div>
            <div>
              <Button
                className="w-full"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["reading", walletAddress, targetDateStr],
                  })
                }
              >
                {t("dashboard.retry")}
              </Button>
            </div>
          </Card>
        ) : reading ? (
          <section>
            {isMobileLayout ? (
              <Tabs defaultValue="potensi-peluang" className="w-full">
                {dateNavigation}
                <ScrollableTabsList
                  interests={interests}
                  t={t}
                  showPotensiTab
                  className="mt-3"
                />
                <TabsContent value="potensi-peluang" className="mt-2 space-y-3">
                  {alignmentHeader}
                  {readingCards}
                </TabsContent>
                {tabContents}
              </Tabs>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                <div className="sticky top-4 col-span-5 flex h-[calc(100vh-140px)] flex-col gap-3 overflow-auto pr-2 sm:gap-4 xl:col-span-4">
                  {dateNavigation}
                  {alignmentHeader}
                  {readingCards}
                </div>
                <div className="col-span-7 min-w-0 space-y-4 xl:col-span-8">
                  <Tabs defaultValue="24h" className="w-full">
                    <ScrollableTabsList interests={interests} t={t} />
                    {tabContents}
                  </Tabs>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </Main>
    </>
  );
}
