import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import { AI_CHAT_ADDON } from "@neptu/shared";
import { motion } from "framer-motion";
import { MessageSquare, Coins, Zap, Plus } from "lucide-react";

export function AiChatAddon() {
  const t = useTranslate();

  return (
    <section className="pb-16 sm:pb-24">
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">
                      {t("pricing.aiChat.title")}
                    </h2>
                    <Badge className="bg-cyan-500 text-[10px] text-white">
                      <Plus className="mr-0.5 h-2.5 w-2.5" />
                      {t("pricing.addon")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("pricing.aiChat.desc")}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-background/60 p-4 text-center">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("pricing.aiChat.perCredit")}
                  </p>
                  <div className="text-2xl font-bold">
                    {AI_CHAT_ADDON.PER_MESSAGE.SOL}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      SOL
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {t("pricing.or")} {AI_CHAT_ADDON.PER_MESSAGE.SUDIGITAL}{" "}
                    SUDIGITAL
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("pricing.or")} {AI_CHAT_ADDON.PER_MESSAGE.NEPTU} NEPTU
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground/60">
                    = 1 {t("pricing.aiChat.credit")}
                  </p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-background/60 p-4 text-center">
                  <Badge className="mb-1 text-[10px]">
                    {t("pricing.aiChat.saveBadge")}
                  </Badge>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("pricing.aiChat.pack10")}
                  </p>
                  <div className="text-2xl font-bold">
                    {AI_CHAT_ADDON.PACK_10.SOL}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      SOL
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {t("pricing.or")} {AI_CHAT_ADDON.PACK_10.SUDIGITAL}{" "}
                    SUDIGITAL
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("pricing.or")} {AI_CHAT_ADDON.PACK_10.NEPTU} NEPTU
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground/60">
                    = 10 {t("pricing.aiChat.credits")}
                  </p>
                </div>
              </div>

              {/* How credits work */}
              <div className="mt-6 rounded-lg border border-dashed bg-background/40 p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  {t("pricing.aiChat.howItWorks")}
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Coins className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                    {t("pricing.aiChat.step1")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                    {t("pricing.aiChat.step2")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                    {t("pricing.aiChat.step3")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
