import { motion } from "framer-motion";
import { Shield, Flame, Zap, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface P2PWhySectionProps {
  t: (key: string) => string;
}

export function P2PWhySection({ t }: P2PWhySectionProps) {
  return (
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
  );
}
