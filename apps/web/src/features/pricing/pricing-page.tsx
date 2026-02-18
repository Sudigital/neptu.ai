import { Logo } from "@/assets/logo";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { SUBSCRIPTION_PLANS } from "@neptu/shared";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  Crown,
  Gem,
  Rocket,
  Eye,
  Calendar,
  Brain,
  Heart,
  MessageSquare,
  Flame,
  Check,
  X,
  ArrowRight,
  Coins,
  Zap,
} from "lucide-react";
import React from "react";

import { AiChatAddon } from "./ai-chat-addon";
import { PaymentIncentives } from "./payment-incentives";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const tiers = [
  {
    key: "FREE" as const,
    icon: Eye,
    color: "from-slate-400 to-slate-500",
    badge: null,
  },
  {
    key: "WEEKLY" as const,
    icon: Rocket,
    color: "from-violet-500 to-purple-600",
    badge: null,
  },
  {
    key: "MONTHLY" as const,
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    badge: "pricing.popular",
  },
  {
    key: "YEARLY" as const,
    icon: Gem,
    color: "from-emerald-500 to-teal-600",
    badge: "pricing.bestValue",
  },
];

interface FeatureRowProps {
  icon: React.ReactNode;
  label: string;
  values: (boolean | string)[];
}

function FeatureRow({ icon, label, values }: FeatureRowProps) {
  return (
    <div className="grid grid-cols-5 items-center border-b border-border/50 py-2.5 last:border-0">
      <div className="col-span-1 flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <span className="text-xs sm:hidden">{label}</span>
      </div>
      {values.map((val, i) => (
        <div key={i} className="col-span-1 text-center text-sm">
          {typeof val === "string" && (
            <span className="font-medium">{val}</span>
          )}
          {typeof val !== "string" && val && (
            <Check className="mx-auto h-4 w-4 text-primary" />
          )}
          {typeof val !== "string" && !val && (
            <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
          )}
        </div>
      ))}
    </div>
  );
}

export function PricingPage() {
  const { isAuthenticated, isAuthenticating, showLogin } = useUser();
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-3xl"
            >
              <Badge
                variant="outline"
                className="mb-4 border-primary/50 text-primary"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {t("pricing.badge")}
              </Badge>
              <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
                {t("pricing.title")}
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                {t("pricing.subtitle")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4 text-amber-500" />
                {t("pricing.payWith")}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-orange-500" />
                {t("pricing.burnNote")}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto px-4">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {tiers.map((tier) => {
                const plan = SUBSCRIPTION_PLANS[tier.key];
                const Icon = tier.icon;
                const isPopular = tier.badge === "pricing.popular";
                const isFree = tier.key === "FREE";

                return (
                  <motion.div key={tier.key} variants={fadeUp}>
                    <Card
                      className={`relative flex h-full flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${isPopular ? "border-primary shadow-md ring-1 ring-primary/20" : ""}`}
                    >
                      {tier.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge
                            className={`${isPopular ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"}`}
                          >
                            {t(tier.badge)}
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-2 text-center">
                        <div
                          className={`mx-auto mb-3 h-12 w-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold">
                          {t(`pricing.${tier.key.toLowerCase()}.name`)}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t(`pricing.${tier.key.toLowerCase()}.desc`)}
                        </p>
                      </CardHeader>

                      <CardContent className="flex-1">
                        {/* Price */}
                        <div className="mb-4 flex h-24 flex-col items-center justify-center text-center">
                          {isFree ? (
                            <div className="text-3xl font-bold">
                              {t("pricing.free")}
                            </div>
                          ) : (
                            <>
                              <div className="text-3xl font-bold">
                                {plan.SOL}
                                <span className="ml-1 text-base font-normal text-muted-foreground">
                                  SOL
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {t("pricing.or")}{" "}
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {plan.SUDIGITAL} SUDIGITAL
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                                +{" "}
                                {t("pricing.earnNeptu").replace(
                                  "{{amount}}",
                                  String(plan.SUDIGITAL)
                                )}
                              </div>
                              <div className="mt-0.5 text-sm text-muted-foreground">
                                {t("pricing.or")}{" "}
                                <span className="font-semibold text-foreground">
                                  {plan.NEPTU} NEPTU
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Duration badge */}
                        <div className="mb-4 flex justify-center">
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="mr-1 h-3 w-3" />
                            {isFree
                              ? t("pricing.todayOnly")
                              : t(`pricing.${tier.key.toLowerCase()}.duration`)}
                          </Badge>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2.5">
                          <li className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 shrink-0 text-primary" />
                            <span className="text-muted-foreground">
                              {isFree
                                ? t("pricing.feature.calendarToday")
                                : t("pricing.feature.calendarDays", "").replace(
                                    "{days}",
                                    String(plan.calendarDays)
                                  )}
                            </span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            {plan.aiFeedback ? (
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                            ) : (
                              <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                            )}
                            <span
                              className={
                                plan.aiFeedback
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/50 line-through"
                              }
                            >
                              {t("pricing.feature.aiFeedback")}
                            </span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            {plan.interest ? (
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                            ) : (
                              <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                            )}
                            <span
                              className={
                                plan.interest
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/50 line-through"
                              }
                            >
                              {t("pricing.feature.interest")}
                            </span>
                          </li>
                          {!isFree && (
                            <li className="flex items-center gap-2 text-sm">
                              <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                              <span className="text-muted-foreground/50">
                                {t("pricing.feature.aiChat")}
                                <span className="ml-1 text-[10px] text-muted-foreground/40">
                                  {"("}
                                  {t("pricing.addon")}
                                  {")"}
                                </span>
                              </span>
                            </li>
                          )}
                        </ul>

                        {/* Savings badge for yearly */}
                        {tier.key === "YEARLY" && (
                          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <Zap className="h-3 w-3 text-emerald-500" />
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                {t("pricing.yearlySave")}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter>
                        {!isAuthenticated && !isFree ? (
                          <Button
                            className="w-full"
                            onClick={showLogin}
                            disabled={isAuthenticating}
                          >
                            {isAuthenticating
                              ? t("landing.connecting")
                              : t("pricing.connectWallet")}
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            variant={(() => {
                              if (isPopular) return "default";
                              if (isFree) return "secondary";
                              return "outline";
                            })()}
                          >
                            {isFree
                              ? t("pricing.getStarted")
                              : t("pricing.subscribe")}
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        <AiChatAddon />

        <PaymentIncentives />

        {/* Comparison Table */}
        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-8 text-center text-2xl font-bold">
                {t("pricing.compare")}
              </h2>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="grid grid-cols-5 items-center border-b-2 border-border pb-3">
                    <div className="col-span-1 text-sm font-medium text-muted-foreground">
                      {t("pricing.feature.label")}
                    </div>
                    {tiers.map((tier) => (
                      <div
                        key={tier.key}
                        className="col-span-1 text-center text-sm font-bold"
                      >
                        {t(`pricing.${tier.key.toLowerCase()}.name`)}
                      </div>
                    ))}
                  </div>

                  <FeatureRow
                    icon={<Calendar className="h-4 w-4" />}
                    label={t("pricing.feature.calendarLabel")}
                    values={[t("pricing.today"), "7d", "30d", "365d"]}
                  />
                  <FeatureRow
                    icon={<Brain className="h-4 w-4" />}
                    label={t("pricing.feature.aiFeedback")}
                    values={[false, true, true, true]}
                  />
                  <FeatureRow
                    icon={<Heart className="h-4 w-4" />}
                    label={t("pricing.feature.interest")}
                    values={[false, true, true, true]}
                  />
                  <FeatureRow
                    icon={<MessageSquare className="h-4 w-4" />}
                    label={t("pricing.feature.aiChat")}
                    values={[false, false, false, false]}
                  />
                  <div className="grid grid-cols-5 items-center py-2.5">
                    <div className="col-span-1" />
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="col-span-1 text-center text-[10px] text-muted-foreground"
                      >
                        {i > 0 ? t("pricing.addonAvailable") : ""}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* NEPTU Token Info */}
        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto max-w-3xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <Logo className="h-8 w-8 text-primary" />
                    <h2 className="text-xl font-bold">
                      {t("pricing.tokenTitle")}
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-background/60 p-4 text-center">
                      <div className="text-2xl font-bold text-primary">50%</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("pricing.tokenBurn")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/60 p-4 text-center">
                      <div className="text-2xl font-bold text-primary">1B</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("pricing.tokenSupply")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/60 p-4 text-center">
                      <div className="text-2xl font-bold text-primary">SPL</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("pricing.tokenType")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to="/p2p">
                      <Button variant="outline" size="sm">
                        <ArrowRight className="mr-1 h-4 w-4" />
                        {t("pricing.learnP2P")}
                      </Button>
                    </Link>
                    <a
                      href="https://docs.neptu.sudigital.com/tokenomics"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        {t("pricing.viewTokenomics")}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
