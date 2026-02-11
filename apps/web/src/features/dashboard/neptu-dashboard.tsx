import { useState, useEffect, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Main } from "@/components/layout/main";
import { neptuApi } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { useSettingsStore } from "@/stores/settings-store";
import { Logo } from "@/assets/logo";
import { DashboardHeader } from "./dashboard-header";
import { ReadingDetailCard } from "./reading-detail-card";
import { ScrollableTabsList } from "./scrollable-tabs";
import { InterestOracle } from "./interest-oracle";
import { OracleTabPanel } from "./oracle-tab-panel";
import { HourlyGrid, SoulRadarChart } from "./dashboard-charts";
import { ComparisonBarChart } from "./comparison-bar-chart";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const interests = useMemo(() => user?.interests || [], [user?.interests]);
  const targetDateStr = format(selectedDate, "yyyy-MM-dd");

  // AI Oracle interpretation query
  const {
    data: aiInterpretation,
    isLoading: aiLoading,
    refetch: _refetchAI,
  } = useQuery({
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
        language,
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
    if (hasWallet && !hasBirthDate && !userLoading) {
      navigate({ to: "/settings" });
    }
  }, [hasWallet, hasBirthDate, userLoading, navigate]);

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Logo className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }

  if (hasWallet && !hasBirthDate) {
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
      potensi.lahir_untuk?.name || potensi.frekuensi?.name || "",
    );
    const peluangName = t(
      `wariga.lahirUntuk.${peluang.diberi_hak_untuk?.name}`,
      peluang.diberi_hak_untuk?.name || peluang.frekuensi?.name || "",
    );
    const potensiDesc = t(
      `wariga.lahirUntukDesc.${potensi.lahir_untuk?.description}`,
      potensi.lahir_untuk?.description || "",
    );
    const peluangDesc = t(
      `wariga.lahirUntukDesc.${peluang.diberi_hak_untuk?.description}`,
      peluang.diberi_hak_untuk?.description || "",
    );
    const actionName = t(
      `wariga.tindakan.${peluang.tindakan?.name?.replace(/\s+/g, "_")}`,
      peluang.tindakan?.name || "mindfulness",
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

  if (!hasWallet) {
    return (
      <>
        <DashboardHeader topNav={topNav} t={t} />
        <Main>
          <div className="flex h-[50vh] items-center justify-center">
            <Card className="w-full max-w-md py-6 px-6">
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
      <DashboardHeader topNav={topNav} showVoteButton t={t} />

      <Main>
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <LayoutDashboard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
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
              <p className="text-muted-foreground mt-2">
                {t("dashboard.calculatingReading")}
              </p>
            </div>
          </div>
        ) : readingError ? (
          <Card className="mx-auto max-w-md py-6 px-6">
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
          <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
            {/* Left Side - Reading Cards */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-4 lg:h-[calc(100vh-140px)] flex flex-col gap-3 sm:gap-4 overflow-auto lg:pr-2">
              {/* Date Navigation */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousDay}
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-center font-medium text-sm h-9 sm:h-10",
                        !isToday(selectedDate) &&
                          "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
                      )}
                    >
                      <CalendarIcon className="mr-1.5 sm:mr-2 h-4 w-4" />
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
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Energy Score Header */}
              <div
                className={cn(
                  "rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl",
                  isToday(selectedDate)
                    ? "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"
                    : isPast(selectedDate)
                      ? "bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700"
                      : "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-medium text-white/80">
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
                    <h2 className="mt-1 text-2xl sm:text-4xl font-bold">
                      {reading.potensi?.total_urip ?? 0} /{" "}
                      {reading.peluang?.total_urip ?? 0}
                    </h2>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/70">
                      {t("dashboard.birthEnergy")} /{" "}
                      {isToday(selectedDate)
                        ? t("dashboard.todayEnergy")
                        : format(selectedDate, "MMM d")}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    {isToday(selectedDate) ? (
                      <Sparkles className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
                    ) : isPast(selectedDate) ? (
                      <CalendarIcon className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
                    ) : (
                      <Star className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
                    )}
                  </div>
                </div>
                {readingSummary && (
                  <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl bg-white/10 p-2.5 sm:p-3 backdrop-blur-sm">
                    <p className="text-xs sm:text-sm text-white/90">
                      {readingSummary.alignment}
                    </p>
                  </div>
                )}
              </div>

              {/* PELUANG & POTENSI Cards */}
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <ReadingDetailCard
                  label={t("dashboard.peluang")}
                  subtitle={t("dashboard.peluang.subtitle")}
                  reading={reading.peluang}
                  icon={
                    <Moon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-600 dark:text-sky-400" />
                  }
                  totalUrip={reading.peluang?.total_urip || 0}
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
                  reading={reading.potensi}
                  icon={
                    <Sun className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" />
                  }
                  totalUrip={reading.potensi?.total_urip || 0}
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
            </div>

            {/* Right Side - Tabs: 24h Energy, Oracle Insight, Interests */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 min-w-0">
              <Tabs defaultValue="24h" className="w-full">
                <ScrollableTabsList interests={interests} t={t} />

                {/* Energy & Charts Tab */}
                <TabsContent value="24h" className="mt-2 space-y-4">
                  <HourlyGrid
                    selectedDate={selectedDate}
                    peluang={reading.peluang}
                  />

                  <Separator />

                  {/* Charts — 2 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
                    <div className="min-w-0 overflow-hidden flex flex-col">
                      <h3 className="text-sm font-semibold mb-3">
                        🧠 {t("chart.soulDimensions")}
                      </h3>
                      <SoulRadarChart
                        peluang={reading.peluang}
                        potensi={reading.potensi}
                      />
                    </div>

                    <Separator className="md:hidden" />

                    <div className="min-w-0 overflow-hidden flex flex-col">
                      <h3 className="text-sm font-semibold mb-3">
                        ⚖️ {t("chart.peluangVsPotensi")}
                      </h3>
                      <ComparisonBarChart
                        peluang={reading.peluang}
                        potensi={reading.potensi}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Oracle Insight Tab */}
                <TabsContent value="oracle" className="mt-2">
                  <OracleTabPanel
                    aiLoading={aiLoading}
                    interpretation={aiInterpretation?.interpretation}
                  />
                </TabsContent>

                {/* Interest Oracle Tabs */}
                {interests.map((interest: string) => (
                  <TabsContent
                    key={`content-${interest}`}
                    value={`interest-${interest}`}
                    className="mt-2"
                  >
                    {user?.birthDate && (
                      <InterestOracle
                        interest={interest}
                        birthDate={user.birthDate}
                        targetDate={targetDateStr}
                        language={language}
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </section>
        ) : null}
      </Main>
    </>
  );
}
