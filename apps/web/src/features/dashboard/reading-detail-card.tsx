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
    <div className="flex justify-between items-center">
      <span className="text-[11px] sm:text-xs text-muted-foreground">
        {label}
      </span>
      <span className="text-[11px] sm:text-xs font-medium">{value}</span>
    </div>
  );
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
    <Card className={cn("py-0 gap-0 px-3 sm:px-4", borderClass, bgClass)}>
      <div className="flex items-center justify-between py-2 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg ${iconBgClass}`}
          >
            {icon}
          </div>
          <div className="flex flex-col">
            <span
              className={`text-xs sm:text-sm font-semibold ${labelColorClass}`}
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
        <span className={`text-base sm:text-lg font-bold ${uripColorClass}`}>
          {totalUrip}
        </span>
      </div>
      <div className="space-y-1 sm:space-y-1.5 pb-2 sm:pb-2.5">
        <Row
          label={t("dashboard.sapta")}
          value={t(
            `wariga.day.${reading?.sapta_wara?.name}`,
            reading?.sapta_wara?.name,
          )}
        />
        <Row label={t("dashboard.panca")} value={reading?.panca_wara?.name} />
        <Row label={t("dashboard.wuku")} value={reading?.wuku?.name} />
        <Row
          label={t("dashboard.frekuensi")}
          value={t(
            `${warigaPrefix}.${reading?.frekuensi?.name}`,
            reading?.frekuensi?.name,
          )}
        />
        <div className={`border-t ${dividerClass} my-1.5 sm:my-2`} />
        <Row
          label={t("dashboard.cipta")}
          value={t(
            `wariga.cipta.${reading?.cipta?.name}`,
            reading?.cipta?.name,
          )}
        />
        <Row
          label={t("dashboard.rasa")}
          value={t(`wariga.rasa.${reading?.rasa?.name}`, reading?.rasa?.name)}
        />
        <Row
          label={t("dashboard.karsa")}
          value={t(
            `wariga.karsa.${reading?.karsa?.name?.replace(/[()+-]/g, "_")}`,
            reading?.karsa?.name,
          )}
        />
        <Row
          label={t("dashboard.tindakan")}
          value={t(
            `wariga.tindakan.${reading?.tindakan?.name?.replace(/\s+/g, "_")}`,
            reading?.tindakan?.name,
          )}
        />
        <Row
          label={t("dashboard.siklus")}
          value={t(
            `wariga.siklus.${reading?.siklus?.name}`,
            reading?.siklus?.name,
          )}
        />
      </div>
    </Card>
  );
}
