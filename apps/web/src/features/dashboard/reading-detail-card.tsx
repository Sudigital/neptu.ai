import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReadingData {
  sapta_wara?: { name?: string };
  panca_wara?: { name?: string };
  wuku?: { name?: string };
  frekuensi?: { name?: string };
  cipta?: { name?: string };
  rasa?: { name?: string };
  karsa?: { name?: string };
  tindakan?: { name?: string };
  siklus?: { name?: string };
  total_urip?: number;
}

interface ReadingDetailCardProps {
  label: string;
  subtitle: string;
  reading: ReadingData | undefined;
  icon: ReactNode;
  totalUrip: number;
  borderClass: string;
  bgClass: string;
  labelColorClass: string;
  subtitleColorClass: string;
  uripColorClass: string;
  iconBgClass: string;
  dividerClass: string;
  t: (key: string, fallback?: string) => string;
  warigaPrefix: string;
}

function Row({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground sm:text-xs">
        {label}
      </span>
      <span className="text-[11px] font-medium sm:text-xs">{value || "—"}</span>
    </div>
  );
}

function resolveWariga(
  t: (key: string, fallback?: string) => string,
  prefix: string,
  name: string | undefined,
  transform?: (n: string) => string
): string | undefined {
  if (!name) return undefined;
  const key = transform ? transform(name) : name;
  return t(`${prefix}.${key}`, name);
}

export function ReadingDetailCard({
  label,
  subtitle,
  reading,
  icon,
  totalUrip,
  borderClass,
  bgClass,
  labelColorClass,
  subtitleColorClass,
  uripColorClass,
  iconBgClass,
  dividerClass,
  t,
  warigaPrefix,
}: ReadingDetailCardProps) {
  return (
    <Card className={cn("gap-0 px-3 py-0 sm:px-4", borderClass, bgClass)}>
      <div className="flex items-center justify-between py-2 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-md sm:h-7 sm:w-7 sm:rounded-lg ${iconBgClass}`}
          >
            {icon}
          </div>
          <div className="flex flex-col">
            <span
              className={`text-xs font-semibold sm:text-sm ${labelColorClass}`}
            >
              {label}
            </span>
            <span
              className={`text-[10px] sm:text-[11px] ${subtitleColorClass}`}
            >
              {subtitle}
            </span>
          </div>
        </div>
        <span className={`text-base font-bold sm:text-lg ${uripColorClass}`}>
          {totalUrip}
        </span>
      </div>
      <div className="space-y-1 pb-2 sm:space-y-1.5 sm:pb-2.5">
        <Row
          label={t("dashboard.sapta")}
          value={resolveWariga(t, "wariga.day", reading?.sapta_wara?.name)}
        />
        <Row label={t("dashboard.panca")} value={reading?.panca_wara?.name} />
        <Row label={t("dashboard.wuku")} value={reading?.wuku?.name} />
        <Row
          label={t("dashboard.frekuensi")}
          value={resolveWariga(t, warigaPrefix, reading?.frekuensi?.name)}
        />
        <div className={`border-t ${dividerClass} my-1.5 sm:my-2`} />
        <Row
          label={t("dashboard.cipta")}
          value={resolveWariga(t, "wariga.cipta", reading?.cipta?.name)}
        />
        <Row
          label={t("dashboard.rasa")}
          value={resolveWariga(t, "wariga.rasa", reading?.rasa?.name)}
        />
        <Row
          label={t("dashboard.karsa")}
          value={resolveWariga(t, "wariga.karsa", reading?.karsa?.name, (n) =>
            n.replace(/[()+-]/g, "_")
          )}
        />
        <Row
          label={t("dashboard.tindakan")}
          value={resolveWariga(
            t,
            "wariga.tindakan",
            reading?.tindakan?.name,
            (n) => n.replace(/\s+/g, "_")
          )}
        />
        <Row
          label={t("dashboard.siklus")}
          value={resolveWariga(t, "wariga.siklus", reading?.siklus?.name)}
        />
      </div>
    </Card>
  );
}
