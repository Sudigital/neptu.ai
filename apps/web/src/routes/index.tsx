import React, { Suspense, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet, ArrowRight } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { useSettingsStore } from "@/stores/settings-store";
import { Logo } from "@/assets/logo";
import { useAgentStats } from "@/hooks/use-agent-stats";
import { Navbar } from "@/components/navbar";

const LandingSections = React.lazy(
  () => import("@/features/landing/landing-sections"),
);
const LazyAgentStatsDialog = React.lazy(() =>
  import("@/features/landing/landing-components").then((m) => ({
    default: m.AgentStatsDialog,
  })),
);

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { login, logout, authenticated, ready, connectWallet } = usePrivy();
  const { hasWallet, ready: walletReady } = useUser();
  const navigate = useNavigate();
  const t = useTranslate();
  const { language } = useSettingsStore();
  const { stats: agentStats } = useAgentStats();
  const [showStatsDialog, setShowStatsDialog] = useState(false);

  // Track if user was already authenticated when page loaded
  const wasAuthenticatedOnMount = useRef<boolean | null>(null);

  // Only redirect if user just logged in (not if already authenticated on page load)
  useEffect(() => {
    if (!ready || !walletReady) return;

    // Store initial auth state on first ready
    if (wasAuthenticatedOnMount.current === null) {
      wasAuthenticatedOnMount.current = authenticated && hasWallet;
      return;
    }

    // Redirect only if user just completed login/wallet connection
    // Always go to dashboard - dashboard will check onboarding status
    if (authenticated && hasWallet && !wasAuthenticatedOnMount.current) {
      navigate({ to: "/dashboard" });
    }
  }, [ready, walletReady, authenticated, hasWallet, navigate]);

  // Loading state
  if (!ready || !walletReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Logo className="mx-auto h-16 w-16 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Authenticated but no wallet state
  if (authenticated && !hasWallet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md space-y-8 rounded-2xl border bg-card p-8 shadow-lg"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Logo className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {t("landing.oneLastStep")}
            </h2>
            <p className="text-muted-foreground">
              {t("landing.oneLastStepDesc")}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={connectWallet} size="lg" className="w-full">
              <Wallet className="mr-2 h-5 w-5" />
              {t("landing.connectSolana")}
            </Button>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              {t("landing.signOut")}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div
      key={language}
      className="flex min-h-screen flex-col bg-background selection:bg-primary/20"
    >
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 sm:py-24 md:py-32 lg:pb-40">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
            }}
            className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--token-primary-alpha)_0%,transparent_100%)] opacity-20"
          />

          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-4 sm:mb-8 flex max-w-fit items-center justify-center rounded-full border bg-background/50 px-3 sm:px-4 py-1 sm:py-1.5 backdrop-blur"
            >
              <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-pulse mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                Colosseum Agent Hackathon 2026
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight"
            >
              <span>{t("landing.heroTitle1")}</span> <br />
              <span className="bg-gradient-to-r from-[#9955FF] to-[#7C3AED] bg-clip-text text-transparent">
                {t("landing.heroTitle2")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mx-auto mt-3 sm:mt-6 max-w-2xl px-2 sm:px-4 text-sm sm:text-lg md:text-xl text-muted-foreground leading-relaxed"
            >
              {t("landing.heroDesc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 sm:mt-10 flex flex-col items-center justify-center gap-2.5 sm:gap-4 px-4 sm:flex-row"
            >
              <Button
                size="lg"
                onClick={login}
                className="w-full sm:w-auto sm:min-w-[200px] h-11 sm:h-14 text-sm sm:text-lg px-4 sm:px-8 transition-transform hover:scale-105 active:scale-95"
              >
                <Wallet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t("landing.startJourney")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto sm:min-w-[200px] h-11 sm:h-14 text-sm sm:text-lg px-4 sm:px-8 transition-transform hover:scale-105 active:scale-95"
              >
                <a href="#features">
                  {t("landing.howItWorks")}{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>

        <Suspense fallback={null}>
          <LandingSections t={t} />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 sm:py-12 bg-background">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-3 sm:gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
              Neptu &copy; 2026
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            {t("landing.footer")}
          </p>
        </div>
      </footer>

      {/* Agent Stats Dialog */}
      {showStatsDialog && (
        <Suspense fallback={null}>
          <LazyAgentStatsDialog
            open={showStatsDialog}
            onOpenChange={setShowStatsDialog}
            agentStats={agentStats}
            t={t}
          />
        </Suspense>
      )}
    </div>
  );
}
