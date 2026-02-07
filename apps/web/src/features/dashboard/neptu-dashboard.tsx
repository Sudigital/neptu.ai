import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { format, isToday, isPast, addDays, subDays } from "date-fns";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Sun,
  Moon,
  Star,
  Loader2,
  Bot,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Vote,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { OracleSheet } from "@/features/oracle";
import { neptuApi } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { useSettingsStore } from "@/stores/settings-store";
import { Logo } from "@/assets/logo";

export function Dashboard() {
  const { walletAddress, hasWallet, hasBirthDate, user } = useUser();
  const { language } = useSettingsStore();
  const t = useTranslate();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
      disabled: true,
    },
    {
      title: t("nav.docs"),
      href: "https://docs.neptu.sudigital.com",
      isActive: false,
      disabled: false,
      external: true,
    },
  ];

  // Format selected date for API
  const targetDateStr = format(selectedDate, "yyyy-MM-dd");

  // Get reading for selected date (only if user has birth date)
  const {
    data: readingData,
    isLoading: readingLoading,
    error: readingError,
  } = useQuery({
    queryKey: ["reading", walletAddress, targetDateStr],
    queryFn: () => neptuApi.getReading(walletAddress!, targetDateStr),
    enabled: !!walletAddress && !!user?.birthDate,
    retry: false,
  });

  // AI Interpretation for selected date
  const {
    data: aiInterpretation,
    isLoading: aiLoading,
    refetch: refetchAI,
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
    enabled:
      !!user?.birthDate &&
      !!readingData?.reading &&
      !!import.meta.env.VITE_WORKER_URL,
    retry: false,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // If no birthday, redirect to settings
  useEffect(() => {
    if (hasWallet && !hasBirthDate) {
      navigate({ to: "/settings" });
    }
  }, [hasWallet, hasBirthDate, navigate]);

  // Redirecting to settings
  if (hasWallet && !hasBirthDate) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Logo className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }

  // Date navigation helpers
  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));

  // Generate reading summary from data (no AI needed)
  const getReadingSummary = () => {
    if (!readingData?.reading) return null;
    const { potensi, peluang } = readingData.reading;
    if (!potensi || !peluang) return null;

    const potensiName = potensi.lahir_untuk?.name || potensi.frekuensi?.name;
    const peluangName =
      peluang.diberi_hak_untuk?.name || peluang.frekuensi?.name;

    return {
      potensiSummary: `You were born with ${potensiName} energy (${potensi.lahir_untuk?.description || ""}). Your Wuku is ${potensi.wuku?.name}, giving you a Total Urip of ${potensi.total_urip}.`,
      peluangSummary: `Today's energy is ${peluangName} (${peluang.diberi_hak_untuk?.description || ""}). The recommended action is ${peluang.tindakan?.name || "mindfulness"}.`,
      alignment:
        potensi.frekuensi?.name === peluang.frekuensi?.name
          ? `✨ ${t("dashboard.perfectAlignment")}`
          : `Today's ${peluangName} energy complements your ${potensiName} nature.`,
    };
  };
  const readingSummary = getReadingSummary();

  const reading = readingData?.reading;

  if (!hasWallet) {
    return (
      <>
        <Header>
          <TopNav links={topNav} />
          <div className="ms-auto flex items-center space-x-4">
            <OracleSheet />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex h-[50vh] items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>{t("dashboard.connectWallet")}</CardTitle>
                <CardDescription>
                  {t("dashboard.connectWalletDesc")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Main>
      </>
    );
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center gap-2 sm:gap-4">
          <Button
            asChild
            size="sm"
            className="hidden sm:flex bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg animate-pulse hover:animate-none"
          >
            <a
              href="https://colosseum.com/agent-hackathon/projects/neptu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Vote className="h-4 w-4" />
              <span className="hidden md:inline">
                {t("common.voteForNeptu")}
              </span>
              <span className="md:hidden">Vote</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <OracleSheet />
          <ThemeSwitch />
          <div className="hidden sm:block">
            <ConfigDrawer />
          </div>
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isToday(selectedDate)
              ? t("dashboard.subtitle.today")
              : isPast(selectedDate)
                ? t("dashboard.subtitle.past")
                : t("dashboard.subtitle.future")}
          </p>
        </div>

        {readingLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-2">
                Calculating your reading...
              </p>
            </div>
          </div>
        ) : readingError ? (
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>
                Failed to load your reading. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["reading", walletAddress, targetDateStr],
                  })
                }
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : reading ? (
          <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
            {/* Left Side - Reading Cards */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-4 lg:h-[calc(100vh-140px)] flex flex-col gap-3 sm:gap-4 overflow-auto lg:pr-2">
              {/* Date Navigation - Full Width of Left Card */}
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
                      {isToday(selectedDate)
                        ? t("dashboard.today")
                        : format(selectedDate, "MMM d, yyyy")}
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

              {/* PELUANG & POTENSI Grid - PELUANG top, POTENSI bottom */}
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {/* PELUANG Mini Card */}
                <div className="rounded-lg sm:rounded-xl border border-sky-200/50 bg-gradient-to-br from-sky-50 to-blue-50 p-3 sm:p-4 dark:border-sky-800/50 dark:from-sky-950/30 dark:to-blue-950/30">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg bg-sky-500/20">
                        <Moon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-300">
                          {t("dashboard.peluang")}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-sky-600/70 dark:text-sky-400/70">
                          {t("dashboard.peluang.subtitle")}
                        </span>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400">
                      {reading.peluang?.total_urip || 0}
                    </span>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.sapta")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.day.${reading.peluang?.sapta_wara?.name}`,
                          reading.peluang?.sapta_wara?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.panca")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {reading.peluang?.panca_wara?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.wuku")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {reading.peluang?.wuku?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.frekuensi")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.lahirUntuk.${reading.peluang?.frekuensi?.name}`,
                          reading.peluang?.frekuensi?.name,
                        )}
                      </span>
                    </div>
                    <div className="border-t border-sky-200/50 dark:border-sky-800/50 my-1.5 sm:my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.cipta")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.cipta.${reading.peluang?.cipta?.name}`,
                          reading.peluang?.cipta?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.rasa")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.rasa.${reading.peluang?.rasa?.name}`,
                          reading.peluang?.rasa?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.karsa")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.karsa.${reading.peluang?.karsa?.name?.replace(/[()+-]/g, "_")}`,
                          reading.peluang?.karsa?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.tindakan")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.tindakan.${reading.peluang?.tindakan?.name?.replace(/\s+/g, "_")}`,
                          reading.peluang?.tindakan?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.siklus")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.siklus.${reading.peluang?.siklus?.name}`,
                          reading.peluang?.siklus?.name,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* POTENSI Mini Card */}
                <div className="rounded-lg sm:rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 p-3 sm:p-4 dark:border-amber-800/50 dark:from-amber-950/30 dark:to-orange-950/30">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg bg-amber-500/20">
                        <Sun className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300">
                          {t("dashboard.potensi")}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-amber-600/70 dark:text-amber-400/70">
                          {t("dashboard.potensi.subtitle")}
                        </span>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                      {reading.potensi?.total_urip || 0}
                    </span>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.sapta")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.day.${reading.potensi?.sapta_wara?.name}`,
                          reading.potensi?.sapta_wara?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.panca")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {reading.potensi?.panca_wara?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.wuku")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {reading.potensi?.wuku?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.frekuensi")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.lahirUntuk.${reading.potensi?.frekuensi?.name}`,
                          reading.potensi?.frekuensi?.name,
                        )}
                      </span>
                    </div>
                    <div className="border-t border-amber-200/50 dark:border-amber-800/50 my-1.5 sm:my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.cipta")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.cipta.${reading.potensi?.cipta?.name}`,
                          reading.potensi?.cipta?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.rasa")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.rasa.${reading.potensi?.rasa?.name}`,
                          reading.potensi?.rasa?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.karsa")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.karsa.${reading.potensi?.karsa?.name?.replace(/[()+-]/g, "_")}`,
                          reading.potensi?.karsa?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.tindakan")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.tindakan.${reading.potensi?.tindakan?.name?.replace(/\s+/g, "_")}`,
                          reading.potensi?.tindakan?.name,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        {t("dashboard.siklus")}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium">
                        {t(
                          `wariga.siklus.${reading.potensi?.siklus?.name}`,
                          reading.potensi?.siklus?.name,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - AI Interpretation */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 sm:gap-4">
              <Tabs defaultValue="general" className="w-full">
                <ScrollableTabs interests={user?.interests || []} t={t} />

                {/* General Tab */}
                <TabsContent value="general" className="mt-0">
                  {/* AI Oracle Interpretation */}
                  <Card>
                    <CardHeader className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <CardTitle className="text-base sm:text-lg">
                              {t("dashboard.oracleInsight")}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              {t("dashboard.aiInterpretationFor")}{" "}
                              {isToday(selectedDate)
                                ? t("dashboard.today").toLowerCase()
                                : format(selectedDate, "MMM d, yyyy")}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => refetchAI()}
                          disabled={aiLoading}
                        >
                          <RefreshCw
                            className={cn(
                              "h-5 w-5",
                              aiLoading && "animate-spin",
                            )}
                          />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pt-0 pb-3 sm:pb-4">
                      {/* Interpretation */}
                      {aiLoading ? (
                        <div className="flex items-center justify-center py-8 sm:py-12">
                          <div className="text-center">
                            <Loader2 className="mx-auto h-6 w-6 sm:h-8 sm:w-8 animate-spin text-violet-600" />
                            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
                              {t("dashboard.consultingOracle")}
                            </p>
                          </div>
                        </div>
                      ) : aiInterpretation?.interpretation ? (
                        <HighlightedText
                          text={aiInterpretation.interpretation}
                        />
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <div className="rounded-full bg-gradient-to-br from-violet-100 to-purple-100 p-4 sm:p-6 inline-block dark:from-violet-900/30 dark:to-purple-900/30">
                            <Bot className="h-8 w-8 sm:h-12 sm:w-12 text-violet-600 dark:text-violet-400" />
                          </div>
                          <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">
                            {t("dashboard.oracleInsight")}
                          </h3>
                          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                            {t("dashboard.selectDatePrompt")}
                          </p>
                          <Button
                            className="mt-4 bg-gradient-to-r from-violet-600 to-purple-600"
                            onClick={() => refetchAI()}
                            disabled={!user?.birthDate}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {t("dashboard.getInterpretation")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Interest Tabs - Only show if user has selected interests */}
                {user?.interests &&
                  user.interests.length > 0 &&
                  user.interests.map((interest: string) => (
                    <TabsContent
                      key={interest}
                      value={interest}
                      className="mt-0"
                    >
                      <InterestOracle
                        interest={interest}
                        birthDate={user?.birthDate || ""}
                        targetDate={targetDateStr}
                        language={language}
                      />
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

function InterestOracle({
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
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Parse insights from the main response
  const parseInsights = (message: string | undefined) => {
    const defaults: Record<string, { affirmation: string; action: string }> = {
      career: { affirmation: "I AM SUCCESSFUL", action: "Network" },
      finance: { affirmation: "I AM ABUNDANT", action: "Invest wisely" },
      love: { affirmation: "I AM LOVED", action: "Express gratitude" },
      health: { affirmation: "I AM VITAL", action: "Move your body" },
    };
    const fallback = defaults[interest] || {
      affirmation: "I AM FOCUSED",
      action: "Take action",
    };

    if (!message) return { ...fallback, mainText: "" };

    let affirmation = fallback.affirmation;
    let action = fallback.action;
    let mainText = message;

    const lines = message.split("\n");
    const contentLines: string[] = [];

    for (const line of lines) {
      if (line.toUpperCase().includes("AFFIRMATION:")) {
        affirmation = line.replace(/AFFIRMATION:/i, "").trim();
      } else if (line.toUpperCase().includes("ACTION:")) {
        action = line.replace(/ACTION:/i, "").trim();
      } else {
        contentLines.push(line);
      }
    }

    mainText = contentLines.join("\n").trim();

    return { affirmation, action, mainText };
  };

  const insights = parseInsights(data?.message);

  const interestConfig: Record<
    string,
    { icon: string; bgColor: string; iconColor: string }
  > = {
    career: {
      icon: "💼",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    finance: {
      icon: "💰",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    love: {
      icon: "💕",
      bgColor: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
    health: {
      icon: "🏃",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    spirituality: {
      icon: "🙏",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    family: {
      icon: "👨‍👩‍👧‍👦",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    travel: {
      icon: "✈️",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    creativity: {
      icon: "🎨",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    education: {
      icon: "📚",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    relationships: {
      icon: "🤝",
      bgColor: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
  };

  const config = interestConfig[interest] || {
    icon: "✨",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  };

  return (
    <Card>
      <CardHeader className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full",
                config.bgColor,
              )}
            >
              <span className="text-base sm:text-xl">{config.icon}</span>
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg capitalize">
                {interest} Insight
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Guidance for {format(new Date(targetDate), "MMM d, yyyy")}
              </CardDescription>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                isLoading && "animate-spin",
              )}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pt-0 pb-3 sm:pb-4">
        {/* Interpretation */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Analyzing {interest}...
            </p>
          </div>
        ) : insights.mainText ? (
          <HighlightedText text={insights.mainText} />
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-muted-foreground">
              No specific insight available for {interest} at this time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScrollableTabs({
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

  const icons: Record<string, string> = {
    career: "💼",
    finance: "💰",
    love: "💕",
    health: "🏃",
    spirituality: "🙏",
    family: "👨‍👩‍👧‍👦",
    travel: "✈️",
    creativity: "🎨",
    education: "📚",
    relationships: "🤝",
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
              <span>🌴</span>
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

// Color styles for highlighting (using inline styles to override prose)
const highlightColors: Record<string, { light: string; dark: string }> = {
  pink: { light: "rgba(251, 207, 232, 0.8)", dark: "rgba(236, 72, 153, 0.3)" },
  amber: { light: "rgba(253, 230, 138, 0.8)", dark: "rgba(245, 158, 11, 0.3)" },
  violet: {
    light: "rgba(221, 214, 254, 0.8)",
    dark: "rgba(139, 92, 246, 0.3)",
  },
};

// Component to highlight quoted terms in AI response
// Since AI uses quotes for important terms (which may be translated), we highlight ALL quoted text
function HighlightedText({
  text,
}: {
  text: string;
  highlights?: { term: string; color: string }[]; // kept for backwards compatibility
}) {
  // Get background color based on theme
  const isDark = document.documentElement.classList.contains("dark");

  // Color sequence for quoted terms
  const colorSequence = ["pink", "amber", "violet"];

  // Render content with highlighted quoted terms
  const renderContent = (content: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let keyIdx = 0;
    let colorIdx = 0;

    // Match quoted text: "text" or «text» or „text" or "text"
    const quoteRegex = /["«„"]([^"»"'"]+)["»"'"]/g;
    let lastIndex = 0;
    let match;

    while ((match = quoteRegex.exec(content)) !== null) {
      // Add text before the quote
      if (match.index > lastIndex) {
        result.push(
          <span key={keyIdx++}>{content.slice(lastIndex, match.index)}</span>,
        );
      }

      // Get color for this quote
      const colorKey = colorSequence[colorIdx % colorSequence.length];
      const colors = highlightColors[colorKey];
      colorIdx++;

      // Add the highlighted quoted term (without quotes, bold + colored background)
      result.push(
        <mark
          key={keyIdx++}
          style={{
            backgroundColor: isDark ? colors.dark : colors.light,
            padding: "1px 4px",
            borderRadius: "3px",
            fontWeight: 700,
          }}
        >
          {match[1]}
        </mark>,
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(<span key={keyIdx++}>{content.slice(lastIndex)}</span>);
    }

    return result.length > 0 ? result : [<span key={0}>{content}</span>];
  };

  if (!text) return null;

  // Render paragraphs with highlights
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className="text-foreground leading-relaxed">
          {renderContent(paragraph)}
        </p>
      ))}
    </div>
  );
}
