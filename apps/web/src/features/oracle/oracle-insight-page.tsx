import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Loader2, RefreshCw, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Main } from "@/components/layout/main";
import { neptuApi } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { useSettingsStore } from "@/stores/settings-store";
import { HighlightedText } from "../dashboard/highlighted-text";
import { DashboardHeader } from "../dashboard/dashboard-header";
import { InterestCard } from "./interest-card";

export function OracleInsightPage() {
  const { user, hasWallet, isLoading: userLoading } = useUser();
  const { language } = useSettingsStore();
  const t = useTranslate();
  const [oracleDialogOpen, setOracleDialogOpen] = useState(false);

  const targetDate = format(new Date(), "yyyy-MM-dd");

  const {
    data: aiInterpretation,
    isLoading: aiLoading,
    refetch: refetchAI,
  } = useQuery({
    queryKey: [
      "ai-interpretation",
      user?.walletAddress,
      targetDate,
      user?.birthDate,
      language,
    ],
    queryFn: () =>
      neptuApi.getDateInterpretation(
        user?.birthDate || "",
        targetDate,
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
      isActive: false,
      disabled: false,
    },
    {
      title: t("nav.compatibility"),
      href: "/compatibility",
      isActive: false,
      disabled: false,
    },
    {
      title: t("nav.oracleInsight", "Oracle Insight"),
      href: "/oracle-insight",
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

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const interests = user?.interests || [];

  return (
    <>
      <DashboardHeader topNav={topNav} t={t} />
      <Main>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t("nav.oracleInsight", "Oracle Insight")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(
                  "oracle.subtitle",
                  "Personalized guidance for your selected interests",
                )}
              </p>
            </div>
          </div>
        </div>

        {interests.length === 0 ? (
          <Card className="py-12 px-6">
            <div className="text-center max-w-sm mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 mx-auto">
                <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                No interests selected
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Go to Settings &gt; Profile to add your interests and get
                personalized oracle insights.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
            {/* Oracle AI Card - spans 3 rows to look square */}
            <div className="row-span-3">
              <Card
                className={cn(
                  "h-full py-5 px-5 gap-0 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] border flex flex-col",
                  "bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30",
                  "border-violet-200 dark:border-violet-800/50",
                )}
                onClick={() => {
                  if (!aiLoading) setOracleDialogOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 ring-1 ring-black/5 dark:ring-white/10">
                    <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      {t("dashboard.oracleInsight", "Today's Oracle")}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t(
                        "dashboard.aiInterpretationFor",
                        "AI interpretation for",
                      )}{" "}
                      {isToday(new Date())
                        ? t("dashboard.today", "today").toLowerCase()
                        : format(new Date(), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center mt-4">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t(
                          "dashboard.consultingOracle",
                          "Consulting oracle...",
                        )}
                      </p>
                    </div>
                  ) : aiInterpretation?.interpretation ? (
                    <p className="text-xs leading-relaxed text-foreground/80 line-clamp-6">
                      {aiInterpretation.interpretation
                        .replace(/[*#_~`>]/g, "")
                        .slice(0, 280)}
                      ...
                    </p>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-4">
                      <div className="rounded-full bg-violet-100 dark:bg-violet-900/30 p-3">
                        <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        ✨ Tap to get your daily reading
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-800/30">
                  Tap to read full interpretation
                </p>
              </Card>

              <Dialog
                open={oracleDialogOpen}
                onOpenChange={setOracleDialogOpen}
              >
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      <span>
                        {t("dashboard.oracleInsight", "Today's Oracle")}
                      </span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          {t(
                            "dashboard.consultingOracle",
                            "Consulting the oracle...",
                          )}
                        </p>
                      </div>
                    ) : aiInterpretation?.interpretation ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <HighlightedText
                          text={aiInterpretation.interpretation}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Bot className="mx-auto h-8 w-8 text-violet-400" />
                        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                          {t(
                            "dashboard.selectDatePrompt",
                            "Get your AI-powered daily interpretation",
                          )}
                        </p>
                        <Button
                          className="mt-3 bg-gradient-to-r from-violet-600 to-purple-600"
                          size="sm"
                          onClick={() => refetchAI()}
                          disabled={!user?.birthDate}
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          {t(
                            "dashboard.getInterpretation",
                            "Get Interpretation",
                          )}
                        </Button>
                      </div>
                    )}
                    {aiInterpretation?.interpretation && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refetchAI()}
                          disabled={aiLoading}
                        >
                          <RefreshCw
                            className={cn(
                              "h-3.5 w-3.5 mr-1.5",
                              aiLoading && "animate-spin",
                            )}
                          />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {interests.map((interest: string) => (
              <InterestCard
                key={interest}
                interest={interest}
                birthDate={user?.birthDate || ""}
                targetDate={targetDate}
                language={language}
              />
            ))}
          </div>
        )}
      </Main>
    </>
  );
}
