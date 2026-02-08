import React from "react";
import { Link } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { useTranslate } from "@/hooks/use-translate";
import { Logo } from "@/assets/logo";
import { SUBSCRIPTION_PLANS } from "@neptu/shared";
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
    <div className="grid grid-cols-5 items-center py-2.5 border-b border-border/50 last:border-0">
      <div className="col-span-1 flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden text-xs">{label}</span>
      </div>
      {values.map((val, i) => (
        <div key={i} className="col-span-1 text-center text-sm">
          {typeof val === "string" ? (
            <span className="font-medium">{val}</span>
          ) : val ? (
            <Check className="h-4 w-4 text-primary mx-auto" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
          )}
        </div>
      ))}
    </div>
  );
}

export function PricingPage() {
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <Badge
                variant="outline"
                className="mb-4 border-primary/50 text-primary"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {t("pricing.badge")}
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                {t("pricing.title")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("pricing.subtitle")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                <Coins className="h-4 w-4 text-amber-500" />
                {t("pricing.payWith")}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
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
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            >
              {tiers.map((tier) => {
                const plan = SUBSCRIPTION_PLANS[tier.key];
                const Icon = tier.icon;
                const isPopular = tier.badge === "pricing.popular";
                const isFree = tier.key === "FREE";

                return (
                  <motion.div key={tier.key} variants={fadeUp}>
                    <Card
                      className={`relative h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 ${isPopular ? "border-primary shadow-md ring-1 ring-primary/20" : ""}`}
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

                      <CardHeader className="text-center pb-2">
                        <div
                          className={`mx-auto mb-3 h-12 w-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold">
                          {t(`pricing.${tier.key.toLowerCase()}.name`)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(`pricing.${tier.key.toLowerCase()}.desc`)}
                        </p>
                      </CardHeader>

                      <CardContent className="flex-1">
                        {/* Price */}
                        <div className="text-center mb-4 h-16 flex flex-col items-center justify-center">
                          {isFree ? (
                            <div className="text-3xl font-bold">
                              {t("pricing.free")}
                            </div>
                          ) : (
                            <>
                              <div className="text-3xl font-bold">
                                {plan.SOL}
                                <span className="text-base font-normal text-muted-foreground ml-1">
                                  SOL
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {t("pricing.or")}{" "}
                                <span className="font-semibold text-foreground">
                                  {plan.NEPTU} NEPTU
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Duration badge */}
                        <div className="flex justify-center mb-4">
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {isFree
                              ? t("pricing.todayOnly")
                              : t(`pricing.${tier.key.toLowerCase()}.duration`)}
                          </Badge>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2.5">
                          <li className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">
                              {isFree
                                ? t("pricing.feature.calendarToday")
                                : t("pricing.feature.calendarDays", "").replace(
                                    "{days}",
                                    String(plan.calendarDays),
                                  )}
                            </span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            {plan.aiFeedback ? (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
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
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
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
                              <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                              <span className="text-muted-foreground/50">
                                {t("pricing.feature.aiChat")}
                                <span className="text-[10px] ml-1 text-muted-foreground/40">
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
                          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <Zap className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {t("pricing.yearlySave")}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter>
                        <Button
                          className="w-full"
                          variant={
                            isPopular
                              ? "default"
                              : isFree
                                ? "secondary"
                                : "outline"
                          }
                          onClick={() => !authenticated && login()}
                        >
                          {isFree
                            ? t("pricing.getStarted")
                            : authenticated
                              ? t("pricing.subscribe")
                              : t("pricing.connectWallet")}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
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
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-center mb-8">
                {t("pricing.compare")}
              </h2>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="grid grid-cols-5 items-center pb-3 border-b-2 border-border">
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
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Logo className="h-8 w-8 text-primary" />
                    <h2 className="text-xl font-bold">
                      {t("pricing.tokenTitle")}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-background/60 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">50%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("pricing.tokenBurn")}
                      </p>
                    </div>
                    <div className="bg-background/60 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">1B</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("pricing.tokenSupply")}
                      </p>
                    </div>
                    <div className="bg-background/60 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">SPL</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("pricing.tokenType")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <Link to="/p2p">
                      <Button variant="outline" size="sm">
                        <ArrowRight className="h-4 w-4 mr-1" />
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
