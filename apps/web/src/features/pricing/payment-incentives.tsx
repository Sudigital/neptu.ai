import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import { motion } from "framer-motion";
import {
  Gift,
  Coins,
  Zap,
  ArrowRight,
  Percent,
  Flame,
  TrendingDown,
  Layers,
} from "lucide-react";

export function PaymentIncentives() {
  const t = useTranslate();

  return (
    <section className="pb-16 sm:pb-24">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-3 text-center text-2xl font-bold">
            {t("pricing.incentives.title")}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-muted-foreground">
            {t("pricing.incentives.subtitle")}
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Pay with SOL → Earn NEPTU */}
            <Card className="flex flex-col border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardContent className="flex-1 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {t("pricing.incentives.sol.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("pricing.incentives.sol.subtitle")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Coins className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sol.earn")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sol.use")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sol.flywheel")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pt-0 pb-6">
                <div className="w-full rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {t("pricing.incentives.sol.pool")}
                  </p>
                </div>
              </CardFooter>
            </Card>

            {/* Pay with SUDIGITAL → Earn NEPTU */}
            <Card className="flex flex-col border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="flex-1 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {t("pricing.incentives.sudigital.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("pricing.incentives.sudigital.subtitle")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Coins className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.pay")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Gift className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.earn")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.ecosystem")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.fast")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pt-0 pb-6">
                <div className="w-full rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-center">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t("pricing.incentives.sudigital.note")}
                  </p>
                </div>
              </CardFooter>
            </Card>

            {/* Pay with NEPTU → Discount + Burn */}
            <Card className="flex flex-col border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
              <CardContent className="flex-1 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                    <Percent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {t("pricing.incentives.neptu.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("pricing.incentives.neptu.subtitle")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Percent className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.neptu.discount")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.neptu.burn")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.neptu.deflationary")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pt-0 pb-6">
                <div className="w-full rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-center">
                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                    {t("pricing.incentives.neptu.example")}
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
