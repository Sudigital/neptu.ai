import React, { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  Wallet,
  Bot,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  FileText,
  AtSign,
  ExternalLink,
  Trophy,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { useSettingsStore } from "@/stores/settings-store";
import { Logo } from "@/assets/logo";
import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAgentStats } from "@/hooks/use-agent-stats";
import { ProfileDropdown } from "@/components/profile-dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div
      key={language}
      className="flex min-h-screen flex-col bg-background selection:bg-primary/20"
    >
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md"
      >
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                Neptu
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="https://docs.neptu.sudigital.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {t("nav.docs")}
              </a>
              <button
                onClick={() => setShowStatsDialog(true)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Bot className="h-4 w-4" />
                {t("nav.agent")}
                {agentStats && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                    {agentStats.project.totalVotes}
                  </span>
                )}
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-4">
            <LanguageSwitcher />
            <ThemeSwitch />
            {authenticated && hasWallet ? (
              <ProfileDropdown />
            ) : (
              <Button
                onClick={authenticated ? connectWallet : login}
                size="sm"
                className="bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white text-xs sm:text-sm px-2.5 sm:px-4"
              >
                <Wallet className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {t("landing.connectWallet")}
                </span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

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

        {/* Feature Grid */}
        <section
          id="features"
          className="container mx-auto px-4 py-10 sm:py-16 md:py-24"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-16"
          >
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-2 sm:mt-4 text-sm sm:text-lg text-muted-foreground">
              {t("landing.featuresDesc")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-[#9945FF]" />}
              title={t("landing.feature1.title")}
              subtitle={t("landing.feature1.subtitle")}
              description={t("landing.feature1.desc")}
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8 text-primary" />}
              title={t("landing.feature2.title")}
              subtitle={t("landing.feature2.subtitle")}
              description={t("landing.feature2.desc")}
            />
            <FeatureCard
              icon={<Bot className="h-8 w-8 text-blue-500" />}
              title={t("landing.feature3.title")}
              subtitle={t("landing.feature3.subtitle")}
              description={t("landing.feature3.desc")}
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-amber-500" />}
              title={t("landing.feature4.title")}
              subtitle={t("landing.feature4.subtitle")}
              description={t("landing.feature4.desc")}
            />
          </motion.div>
        </section>

        {/* Steps Section */}
        <section className="border-t bg-muted/50 py-10 sm:py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl text-center mb-8 sm:mb-16"
            >
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
                {t("landing.stepsTitle")}
              </h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0"
            >
              <StepCard
                number="01"
                icon={<Wallet className="h-6 w-6" />}
                title={t("landing.step1.title")}
                desc={t("landing.step1.desc")}
              />
              <ArrowRight className="hidden lg:block h-8 w-8 text-muted-foreground/50 mx-4 flex-shrink-0" />
              <StepCard
                number="02"
                icon={<Calendar className="h-6 w-6" />}
                title={t("landing.step2.title")}
                desc={t("landing.step2.desc")}
              />
              <ArrowRight className="hidden lg:block h-8 w-8 text-muted-foreground/50 mx-4 flex-shrink-0" />
              <StepCard
                number="03"
                icon={<Sparkles className="h-6 w-6" />}
                title={t("landing.step3.title")}
                desc={t("landing.step3.desc")}
              />
            </motion.div>
          </div>
        </section>
        {/* Vote CTA Section */}
        <section
          id="vote"
          className="py-10 sm:py-16 bg-gradient-to-r from-[#9955FF]/10 to-[#7C3AED]/10"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl space-y-3 sm:space-y-6"
            >
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
                {t("landing.voteTitle")}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-lg">
                {t("landing.voteDesc")}
              </p>
              <p className="text-xs sm:text-sm font-medium text-[#7C3AED]">
                🎁 {t("landing.voteReward")}
              </p>
              <Button
                size="lg"
                className="h-11 sm:h-14 px-6 sm:px-8 text-sm sm:text-lg bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white w-full sm:w-auto"
                asChild
              >
                <a
                  href="https://colosseum.com/agent-hackathon/projects/neptu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("landing.voteButton")} 🗳️
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
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
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t("agent.stats.title")}
            </DialogTitle>
            <DialogDescription>{t("agent.stats.desc")}</DialogDescription>
          </DialogHeader>

          {agentStats ? (
            <div className="space-y-4">
              {/* Agent Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    {agentStats.agent.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{agentStats.agent.xUsername}
                  </p>
                </div>
                {agentStats.agent.rank > 0 && (
                  <div className="ml-auto flex items-center gap-1 text-amber-500">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      #{agentStats.agent.rank}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {agentStats.stats.posts}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("agent.stats.posts")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {agentStats.stats.comments}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("agent.stats.comments")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <ThumbsUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {agentStats.stats.votesGiven}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("agent.stats.votesGiven")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <AtSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {agentStats.stats.mentions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("agent.stats.mentions")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Votes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("agent.stats.projectVotes")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {agentStats.project.totalVotes}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("agent.stats.total")}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>👤 {agentStats.project.humanVotes} human</p>
                        <p>🤖 {agentStats.project.agentVotes} agent</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* View Project Button */}
              <Button
                className="w-full"
                onClick={() => window.open(agentStats.projectUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("agent.stats.viewProject")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Logo className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-lg sm:rounded-2xl border bg-card p-4 sm:p-6 md:p-8 transition-shadow hover:shadow-lg"
    >
      <div className="mb-2.5 sm:mb-4 inline-flex rounded-md sm:rounded-xl bg-muted p-2 sm:p-3 group-hover:bg-primary/10 transition-colors">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-6 w-6 sm:h-8 sm:w-8",
          },
        )}
      </div>
      <div className="mb-1 sm:mb-2 text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {subtitle}
      </div>
      <h3 className="mb-1.5 sm:mb-3 text-base sm:text-xl md:text-2xl font-bold">
        {title}
      </h3>
      <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function StepCard({
  number,
  icon,
  title,
  desc,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -5 }}
      className="relative overflow-hidden rounded-lg sm:rounded-2xl border bg-card p-3 sm:p-6 shadow-sm hover:shadow-lg transition-shadow w-full lg:w-64 lg:h-64 flex flex-col"
    >
      {/* Step number badge */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-2xl sm:text-4xl font-black text-muted/10 select-none">
        {number}
      </div>

      {/* Icon */}
      <div className="mb-2 sm:mb-4 inline-flex rounded-md sm:rounded-xl bg-[#7C3AED]/10 p-2 sm:p-3 text-[#7C3AED] w-fit">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-5 w-5 sm:h-6 sm:w-6",
          },
        )}
      </div>

      {/* Content */}
      <h3 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2">{title}</h3>
      <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed flex-1">
        {desc}
      </p>
    </motion.div>
  );
}
