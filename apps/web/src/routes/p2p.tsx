import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Shield,
  Zap,
  DollarSign,
  Flame,
  Lock,
  Wallet,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { useTranslate } from "@/hooks/use-translate";
import { Logo } from "@/assets/logo";

export const Route = createFileRoute("/p2p")({
  component: P2PPage,
});

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function P2PPage() {
  const { login, authenticated } = usePrivy();
  const t = useTranslate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--token-primary-alpha)_0%,transparent_100%)] opacity-15" />
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 backdrop-blur"
            >
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {t("p2p.badge")}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] border-amber-500 text-amber-500"
              >
                {t("p2p.soon")}
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mx-auto max-w-3xl text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
            >
              {t("p2p.heroTitle1")}{" "}
              <span className="bg-gradient-to-r from-[#9955FF] to-[#7C3AED] bg-clip-text text-transparent">
                {t("p2p.heroTitle2")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg text-muted-foreground leading-relaxed"
            >
              {t("p2p.heroDesc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              {!authenticated ? (
                <Button
                  size="lg"
                  onClick={login}
                  className="w-full sm:w-auto h-12 px-8 text-base"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  {t("p2p.connectToTrade")}
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="w-full sm:w-auto h-12 px-8 text-base opacity-70"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  {t("p2p.comingSoon")}
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto h-12 px-8 text-base"
              >
                <a href="#how-it-works">
                  {t("p2p.learnMore")} <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-t py-12 sm:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                {t("p2p.howTitle")}
              </h2>
              <p className="mt-3 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("p2p.howDesc")}
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
            >
              {/* Pay with SOL */}
              <motion.div variants={fadeUp}>
                <Card className="h-full border-green-500/30 hover:border-green-500/50 transition-colors">
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t("p2p.paySOL.title")}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-green-600 border-green-500"
                        >
                          {t("p2p.paySOL.badge")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("p2p.paySOL.desc")}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{t("p2p.paySOL.step1")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{t("p2p.paySOL.step2")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{t("p2p.paySOL.step3")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pay with NEPTU */}
              <motion.div variants={fadeUp}>
                <Card className="h-full border-purple-500/30 hover:border-purple-500/50 transition-colors">
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Logo className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t("p2p.payNEPTU.title")}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-purple-600 border-purple-500"
                        >
                          {t("p2p.payNEPTU.badge")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("p2p.payNEPTU.desc")}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span>{t("p2p.payNEPTU.step1")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                        <span>{t("p2p.payNEPTU.step2")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span>{t("p2p.payNEPTU.step3")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* P2P Transfer */}
              <motion.div variants={fadeUp}>
                <Card className="h-full border-blue-500/30 hover:border-blue-500/50 transition-colors">
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t("p2p.transfer.title")}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-blue-600 border-blue-500"
                        >
                          {t("p2p.transfer.badge")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("p2p.transfer.desc")}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{t("p2p.transfer.step1")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{t("p2p.transfer.step2")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{t("p2p.transfer.step3")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Why P2P Section */}
        <section className="border-t bg-muted/50 py-12 sm:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                {t("p2p.whyTitle")}
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto"
            >
              <motion.div variants={fadeUp}>
                <Card className="h-full text-center">
                  <CardContent>
                    <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">
                      {t("p2p.why.noPool.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("p2p.why.noPool.desc")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Card className="h-full text-center">
                  <CardContent>
                    <Flame className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">
                      {t("p2p.why.deflationary.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("p2p.why.deflationary.desc")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Card className="h-full text-center">
                  <CardContent>
                    <Zap className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">
                      {t("p2p.why.zeroCost.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("p2p.why.zeroCost.desc")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Card className="h-full text-center">
                  <CardContent>
                    <Lock className="h-8 w-8 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">
                      {t("p2p.why.fixedSupply.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("p2p.why.fixedSupply.desc")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Token Info */}
        <section className="border-t py-12 sm:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-center mb-10">
                {t("p2p.tokenTitle")}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.name")}
                      </span>
                      <span className="font-semibold">NEPTU</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.network")}
                      </span>
                      <span className="font-semibold">Solana (SPL)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.supply")}
                      </span>
                      <span className="font-semibold">1,000,000,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.maxSupply")}
                      </span>
                      <span className="font-semibold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> {t("p2p.token.fixed")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.burnRate")}
                      </span>
                      <span className="font-semibold text-orange-500">
                        50% {t("p2p.token.perPayment")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.platformCost")}
                      </span>
                      <span className="font-semibold text-green-500">$0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.distribution")}
                      </span>
                      <span className="font-semibold">
                        {t("p2p.token.rewardsOnly")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("p2p.token.status")}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500 text-amber-500"
                      >
                        Devnet
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t py-12 sm:py-20 bg-gradient-to-r from-[#9955FF]/10 to-[#7C3AED]/10">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-xl mx-auto space-y-4"
            >
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t("p2p.ctaTitle")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("p2p.ctaDesc")}
              </p>
              {!authenticated ? (
                <Button
                  size="lg"
                  onClick={login}
                  className="h-12 px-8 text-base"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  {t("p2p.ctaButton")}
                </Button>
              ) : (
                <p className="text-sm text-primary font-medium">
                  ✓ {t("p2p.ctaConnected")}
                </p>
              )}
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
    </div>
  );
}
