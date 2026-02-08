import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  Wallet,
  Bot,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureCard, StepCard } from "./landing-components";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

export default function LandingSections({ t }: { t: (key: string) => string }) {
  return (
    <>
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
    </>
  );
}
