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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";

export function PaymentIncentives() {
  const t = useTranslate();

  return (
    <section className="pb-16 sm:pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-center mb-3">
            {t("pricing.incentives.title")}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-xl mx-auto">
            {t("pricing.incentives.subtitle")}
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Pay with SOL → Earn NEPTU */}
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent flex flex-col">
              <CardContent className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
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
                    <Coins className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sol.earn")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sol.use")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sol.flywheel")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0">
                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {t("pricing.incentives.sol.pool")}
                  </p>
                </div>
              </CardFooter>
            </Card>

            {/* Pay with SUDIGITAL → Earn NEPTU */}
            <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent flex flex-col">
              <CardContent className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
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
                    <Coins className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.pay")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Gift className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.earn")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Layers className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.ecosystem")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.sudigital.fast")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0">
                <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t("pricing.incentives.sudigital.note")}
                  </p>
                </div>
              </CardFooter>
            </Card>

            {/* Pay with NEPTU → Discount + Burn */}
            <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent flex flex-col">
              <CardContent className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
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
                    <Percent className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.neptu.discount")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Flame className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.neptu.burn")}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {t("pricing.incentives.neptu.deflationary")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0">
                <div className="w-full bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2 text-center">
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
