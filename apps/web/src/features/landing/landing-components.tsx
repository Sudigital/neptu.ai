import { motion } from "framer-motion";
import React from "react";

export function FeatureCard({
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
      className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6 md:p-8"
    >
      <div className="mb-2.5 inline-flex rounded-md bg-muted p-2 transition-colors group-hover:bg-primary/10 sm:mb-4 sm:rounded-xl sm:p-3">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-6 w-6 sm:h-8 sm:w-8",
          }
        )}
      </div>
      <div className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase sm:mb-2 sm:text-sm">
        {subtitle}
      </div>
      <h3 className="mb-1.5 text-base font-bold sm:mb-3 sm:text-xl md:text-2xl">
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
    </motion.div>
  );
}

export function StepCard({
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
      className="relative flex w-full flex-col overflow-hidden rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6 lg:h-64 lg:w-64"
    >
      <div className="absolute top-2 right-2 text-2xl font-black text-muted/10 select-none sm:top-3 sm:right-3 sm:text-4xl">
        {number}
      </div>
      <div className="mb-2 inline-flex w-fit rounded-md bg-[#7C3AED]/10 p-2 text-[#7C3AED] sm:mb-4 sm:rounded-xl sm:p-3">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-5 w-5 sm:h-6 sm:w-6",
          }
        )}
      </div>
      <h3 className="mb-1 text-sm font-bold sm:mb-2 sm:text-lg">{title}</h3>
      <p className="flex-1 text-[11px] leading-relaxed text-muted-foreground sm:text-sm">
        {desc}
      </p>
    </motion.div>
  );
}
