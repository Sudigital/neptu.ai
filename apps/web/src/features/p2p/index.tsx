import { IconSolana, IconSudigital } from "@/assets/brand-icons";
import { Logo } from "@/assets/logo";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Flame,
  Lock,
  Wallet,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import React from "react";

import { P2PWhySection } from "./p2p-why-section";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function P2PPage() {
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
                className="border-amber-500 text-[10px] text-amber-500"
              >
                {t("p2p.soon")}
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
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
              className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg"
            >
              {t("p2p.heroDesc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              {!authenticated ? (
                <Button
                  size="lg"
                  onClick={login}
                  className="h-12 w-full px-8 text-base sm:w-auto"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  {t("p2p.connectToTrade")}
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="h-12 w-full px-8 text-base opacity-70 sm:w-auto"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  {t("p2p.comingSoon")}
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 w-full px-8 text-base sm:w-auto"
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
              className="mb-10 text-center sm:mb-16"
            >
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
                {t("p2p.howTitle")}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-lg">
                {t("p2p.howDesc")}
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {/* Pay with SOL */}
              <motion.div variants={fadeUp}>
                <Card className="h-full border-green-500/30 transition-colors hover:border-green-500/50">
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                        <IconSolana className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t("p2p.paySOL.title")}
                        </h3>
                        <Badge
                          variant="outline"
                          className="border-green-500 text-[10px] text-green-600"
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
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        <span>{t("p2p.paySOL.step1")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        <span>{t("p2p.paySOL.step2")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        <span>{t("p2p.paySOL.step3")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pay with SUDIGITAL */}
              <motion.div variants={fadeUp}>
                <Card className="h-full border-red-500/30 transition-colors hover:border-red-500/50">
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                        <IconSudigital className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t("p2p.paySUDIGITAL.title")}
                        </h3>
                        <Badge
                          variant="outline"
                          className="border-red-500 text-[10px] text-red-600"
                        >
                          {t("p2p.paySUDIGITAL.badge")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("p2p.paySUDIGITAL.desc")}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span>{t("p2p.paySUDIGITAL.step1")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span>{t("p2p.paySUDIGITAL.step2")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span>{t("p2p.paySUDIGITAL.step3")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pay with NEPTU */}
              <motion.div variants={fadeUp}>
                <Card className="h-full border-purple-500/30 transition-colors hover:border-purple-500/50">
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                        <Logo className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t("p2p.payNEPTU.title")}
                        </h3>
                        <Badge
                          variant="outline"
                          className="border-purple-500 text-[10px] text-purple-600"
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
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span>{t("p2p.payNEPTU.step1")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Flame className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span>{t("p2p.payNEPTU.step2")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span>{t("p2p.payNEPTU.step3")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* P2P Transfer */}
              <motion.div variants={fadeUp}>
                <Card className="h-full border-teal-500/30 transition-colors hover:border-teal-500/50">
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                        <Users className="h-5 w-5 text-teal-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t("p2p.transfer.title")}
                        </h3>
                        <Badge
                          variant="outline"
                          className="border-teal-500 text-[10px] text-teal-600"
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
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span>{t("p2p.transfer.step1")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span>{t("p2p.transfer.step2")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span>{t("p2p.transfer.step3")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <P2PWhySection t={t} />

        {/* Token Info */}
        <section className="border-t py-12 sm:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl"
            >
              <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-4xl">
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
                      <span className="flex items-center gap-1 font-semibold">
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
                        className="border-amber-500 text-xs text-amber-500"
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
        <section className="border-t bg-gradient-to-r from-[#9955FF]/10 to-[#7C3AED]/10 py-12 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-xl space-y-4"
            >
              <h2 className="text-2xl font-bold sm:text-3xl">
                {t("p2p.ctaTitle")}
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
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
                <p className="text-sm font-medium text-primary">
                  ✓ {t("p2p.ctaConnected")}
                </p>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-6 sm:py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 sm:gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
            <span className="text-xs font-semibold text-muted-foreground sm:text-sm">
              Neptu &copy; 2026
            </span>
          </div>
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            {t("landing.footer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
