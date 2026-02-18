import type { CompatibilityResult, MitraSatruCategory } from "@neptu/shared";

import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReadingDetailCard } from "@/features/dashboard/reading-detail-card";
import { OracleSheet } from "@/features/oracle";
import { useTranslate } from "@/hooks/use-translate";
import { neptuApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Heart,
  Loader2,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  AiSummaryCard,
  CompatibilityScores,
  DimensionComparisonList,
  FrekuensiCard,
} from "./components";

const CATEGORY_STYLES: Record<
  MitraSatruCategory,
  { gradient: string; badge: string; ring: string; glow: string }
> = {
  mitra: {
    gradient: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    ring: "ring-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  neutral: {
    gradient: "bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-700",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    ring: "ring-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  satru: {
    gradient: "bg-gradient-to-br from-rose-600 via-red-600 to-pink-700",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    ring: "ring-rose-500/30",
    glow: "shadow-rose-500/20",
  },
};

export function CompatibilityPage() {
  const t = useTranslate();
  const [date1, setDate1] = useState<Date | undefined>();
  const [date2, setDate2] = useState<Date | undefined>();

  const {
    mutate: checkCompatibility,
    data: result,
    isPending,
    reset,
  } = useMutation({
    mutationFn: (params: { birthDate1: string; birthDate2: string }) =>
      neptuApi.getCompatibility(params.birthDate1, params.birthDate2),
  });

  const handleCheck = () => {
    if (!date1 || !date2) return;
    checkCompatibility({
      birthDate1: format(date1, "yyyy-MM-dd"),
      birthDate2: format(date2, "yyyy-MM-dd"),
    });
  };

  const handleReset = () => {
    setDate1(undefined);
    setDate2(undefined);
    reset();
  };

  const reading = result?.reading;
  const category = reading?.mitraSatru.category;
  const styles = category ? CATEGORY_STYLES[category] : null;

  const topNav = [
    {
      title: t("nav.today"),
      href: "/dashboard",
      isActive: false,
      disabled: false,
    },
    {
      title: t("nav.compatibility"),
      href: "/compatibility",
      isActive: true,
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

  return (
    <>
      <Header fixed>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center gap-3 sm:gap-4">
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
              <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {t("compatibility.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("compatibility.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Date Input — two date pickers side by side */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <DatePickerCard
            label={t("compatibility.person1")}
            icon={
              <Sun className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            }
            date={date1}
            onSelect={(d) => {
              setDate1(d);
              reset();
            }}
            placeholder={t("compatibility.selectDate")}
            accentClass="border-amber-200/60 dark:border-amber-800/40"
          />
          <DatePickerCard
            label={t("compatibility.person2")}
            icon={<Moon className="h-4 w-4 text-sky-500 dark:text-sky-400" />}
            date={date2}
            onSelect={(d) => {
              setDate2(d);
              reset();
            }}
            placeholder={t("compatibility.selectDate")}
            accentClass="border-sky-200/60 dark:border-sky-800/40"
          />
        </div>

        {/* Check Button */}
        <div className="mb-8 flex gap-2">
          <Button
            onClick={handleCheck}
            disabled={!date1 || !date2 || isPending}
            size="lg"
            className="h-11 flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("compatibility.checking")}
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                {t("compatibility.check")}
              </>
            )}
          </Button>
          {reading && (
            <Button variant="outline" size="lg" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>

        {/* Results */}
        {reading && styles && category && (
          <CompatibilityResultView
            reading={reading}
            styles={styles}
            category={category}
            t={t}
          />
        )}
      </Main>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Date Picker Card — shows date on line 1, day name on line 2, auto-closes
 * ────────────────────────────────────────────────────────────────────────── */

function DatePickerCard({
  label,
  icon,
  date,
  onSelect,
  placeholder,
  accentClass,
}: {
  label: string;
  icon: ReactNode;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
  accentClass: string;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (d: Date | undefined) => {
    onSelect(d);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent/50 sm:p-4",
            accentClass
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {date ? (
              <>
                <p className="truncate text-sm font-semibold">
                  {format(date, "d MMMM yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(date, "EEEE")}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground/60">{placeholder}</p>
            )}
          </div>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Result View
 * ────────────────────────────────────────────────────────────────────────── */

function CompatibilityResultView({
  reading,
  styles,
  category,
  t,
}: {
  reading: CompatibilityResult;
  styles: { gradient: string; badge: string; ring: string; glow: string };
  category: MitraSatruCategory;
  t: (key: string, fallback?: string) => string;
}) {
  const categoryLabel = t(`compatibility.category.${category}`, category);

  return (
    <div className="space-y-6">
      {/* Hero Score Card */}
      <div
        className={cn(
          "rounded-2xl p-5 text-white shadow-xl sm:p-8",
          styles.gradient,
          styles.glow
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-white/70 uppercase sm:text-sm">
              {t("compatibility.mitraSatru")}
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {reading.scores.overall}
              <span className="text-lg font-normal text-white/50 sm:text-xl">
                /100
              </span>
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                  styles.badge,
                  styles.ring
                )}
              >
                {categoryLabel}
              </span>
              <span className="text-xs text-white/60">
                {reading.mitraSatru.combinedFrekuensi.name}
              </span>
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm sm:h-20 sm:w-20">
            <Heart className="h-8 w-8 text-white sm:h-10 sm:w-10" />
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
          <p className="text-xs leading-relaxed text-white/85 sm:text-sm">
            {t(`compatibility.description.${category}`)}
          </p>
        </div>
      </div>

      {/* 3-Column Layout: Person 1 | AI (full center) | Person 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        {/* Left Column — Person 1 */}
        <div className="space-y-4">
          <FrekuensiCard
            label={t("compatibility.person1")}
            name={reading.mitraSatru.person1Frekuensi.name}
            purpose={reading.person1.lahir_untuk.description}
            t={t}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">
                {t("compatibility.scores")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompatibilityScores
                scores={reading.scores}
                category={category}
                t={t}
              />
            </CardContent>
          </Card>
          <ReadingDetailCard
            label={t("compatibility.person1")}
            subtitle={reading.person1.date}
            reading={reading.person1}
            icon={
              <Sun className="h-3 w-3 text-amber-600 sm:h-3.5 sm:w-3.5 dark:text-amber-400" />
            }
            totalUrip={reading.person1.total_urip}
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

        {/* Center Column — AI Summary (full height) */}
        <div className="lg:row-span-full">
          <AiSummaryCard reading={reading} t={t} />
        </div>

        {/* Right Column — Person 2 */}
        <div className="space-y-4">
          <FrekuensiCard
            label={t("compatibility.person2")}
            name={reading.mitraSatru.person2Frekuensi.name}
            purpose={reading.person2.lahir_untuk.description}
            t={t}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">
                {t("compatibility.dimensions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DimensionComparisonList dimensions={reading.dimensions} t={t} />
            </CardContent>
          </Card>
          <ReadingDetailCard
            label={t("compatibility.person2")}
            subtitle={reading.person2.date}
            reading={reading.person2}
            icon={
              <Moon className="h-3 w-3 text-sky-600 sm:h-3.5 sm:w-3.5 dark:text-sky-400" />
            }
            totalUrip={reading.person2.total_urip}
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
        </div>
      </div>
    </div>
  );
}
