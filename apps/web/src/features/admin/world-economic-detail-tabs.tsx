import type { CompatibilityResult, Peluang, Potensi } from "@neptu/shared";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PROSPERITY_LEVELS } from "@neptu/shared";
import { Calendar, MapPin, Sparkles, TrendingUp, User } from "lucide-react";

import { CATEGORY_STYLES, LEVEL_COLORS } from "./world-economic-parts";

/* ── Constants ───────────────────────────────────────── */

const MAX_PROSPERITY_LEVEL = 8;
const MAX_URIP = 18;
const FULL_SCORE = 100;

type ProsperityLevel = keyof typeof PROSPERITY_LEVELS;

/* ── Shared tiny components ──────────────────────────── */

export function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-xs font-semibold"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Neptu Tab ───────────────────────────────────────── */

interface NeptuTabProps {
  potensi: Potensi | null;
  peluang: Peluang | null;
  compatibility: CompatibilityResult | null;
  personality: { watak: number; descriptions: unknown } | null;
}

export function NeptuTabContent({
  potensi,
  peluang,
  compatibility,
  personality,
}: NeptuTabProps) {
  return (
    <div className="space-y-5">
      {potensi && (
        <Section title="Potensi (Birth Reading)" icon={Sparkles}>
          <div className="space-y-0.5 rounded-md border p-3">
            <StatRow label="Total Urip" value={potensi.total_urip} />
            <StatRow label="Wuku" value={potensi.wuku.name} />
            <StatRow
              label="Sapta Wara"
              value={`${potensi.sapta_wara.name} (${potensi.sapta_wara.gender})`}
            />
            <StatRow
              label="Panca Wara"
              value={`${potensi.panca_wara.name} (${potensi.panca_wara.gender})`}
            />
            <StatRow label="Dualitas" value={potensi.dualitas} />
            <StatRow label="Frekuensi" value={potensi.frekuensi.name} />
            <StatRow label="Dasa Aksara" value={potensi.dasa_aksara.name} />
            <StatRow label="Cipta" value={potensi.cipta.name} />
            <StatRow label="Rasa" value={potensi.rasa.name} />
            <StatRow label="Karsa" value={potensi.karsa.name} />
            <StatRow label="Tindakan" value={potensi.tindakan.name} />
            <StatRow label="Kanda Pat" value={potensi.kanda_pat.name} />
            <StatRow label="Siklus" value={potensi.siklus.name} />
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-semibold">
              Born For: {potensi.lahir_untuk.name}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {potensi.lahir_untuk.description}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-semibold">Affirmation</p>
            <p className="mt-1 text-[11px] text-muted-foreground italic">
              &ldquo;{potensi.afirmasi.name}&rdquo;
            </p>
          </div>
        </Section>
      )}

      <Separator />

      {peluang && (
        <Section title="Today's Energy (Peluang)" icon={Calendar}>
          <div className="space-y-0.5 rounded-md border p-3">
            <StatRow label="Peluang Urip" value={peluang.total_urip} />
            <StatRow label="Wuku" value={peluang.wuku.name} />
            <StatRow label="Sapta Wara" value={peluang.sapta_wara.name} />
            <StatRow label="Panca Wara" value={peluang.panca_wara.name} />
            <StatRow label="Dualitas" value={peluang.dualitas} />
            <StatRow label="Frekuensi" value={peluang.frekuensi.name} />
            <StatRow label="Siklus" value={peluang.siklus.name} />
          </div>
          {peluang.diberi_hak_untuk && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-semibold">
                Granted For: {peluang.diberi_hak_untuk.name}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {peluang.diberi_hak_untuk.description}
              </p>
            </div>
          )}
        </Section>
      )}

      <Separator />

      {compatibility && (
        <Section title="Today's Compatibility" icon={Sparkles}>
          <div className="space-y-0.5 rounded-md border p-3">
            <StatRow
              label="Daily Energy"
              value={`${compatibility.scores.overall}%`}
            />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Category</span>
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                  CATEGORY_STYLES[compatibility.pairing.category].bg,
                  CATEGORY_STYLES[compatibility.pairing.category].text
                )}
              >
                {compatibility.pairing.category}
              </span>
            </div>
            <StatRow
              label="Frekuensi Score"
              value={`${compatibility.scores.frekuensi}%`}
            />
            <StatRow
              label="Cycles Score"
              value={`${compatibility.scores.cycles}%`}
            />
            <StatRow
              label="Traits Score"
              value={`${compatibility.scores.traits}%`}
            />
          </div>
        </Section>
      )}

      <Separator />

      {personality && (
        <Section title="Personality Traits" icon={User}>
          <div className="rounded-md border p-3">
            <p className="text-xs font-semibold">Watak {personality.watak}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {(personality.descriptions as Record<string, string>).en}
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ── Wealth Tab ──────────────────────────────────────── */

interface ProsperityEntry {
  level: number;
  descriptions: unknown;
}

interface ProsperityPeriod {
  level: number;
  fromAge: number;
  toAge: number;
}

interface WealthTabProps {
  netWorthBillions: number | null;
  forbesRank: number | null;
  prosperity: ProsperityEntry | null;
  prosperityPeriods: readonly ProsperityPeriod[] | null;
  age: number | null;
  potensiUrip: number | null;
  peluangUrip: number | null;
}

export function WealthTabContent({
  netWorthBillions,
  forbesRank,
  prosperity,
  prosperityPeriods,
  age,
  potensiUrip,
  peluangUrip,
}: WealthTabProps) {
  return (
    <div className="space-y-5">
      {netWorthBillions !== null && (
        <Section title="Wealth Overview" icon={TrendingUp}>
          <div className="space-y-0.5 rounded-md border p-3">
            <StatRow
              label="Net Worth"
              value={formatNetWorth(netWorthBillions)}
              color="#22c55e"
            />
            {forbesRank !== null && (
              <StatRow label="Forbes Rank" value={`#${forbesRank}`} />
            )}
          </div>
        </Section>
      )}

      {prosperity && (
        <Section title="Current Prosperity" icon={MapPin}>
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{
                  backgroundColor: LEVEL_COLORS[prosperity.level] ?? "#6b7280",
                }}
              >
                {prosperity.level}
              </span>
              <span className="text-xs font-medium">
                {(prosperity.descriptions as Record<string, string>).en}
              </span>
            </div>
            <Progress
              value={(prosperity.level / MAX_PROSPERITY_LEVEL) * FULL_SCORE}
              className="h-2"
            />
            <p className="text-[10px] text-muted-foreground">
              Level {prosperity.level} / {MAX_PROSPERITY_LEVEL}
            </p>
          </div>
        </Section>
      )}

      {prosperityPeriods && prosperityPeriods.length > 0 && (
        <Section title="Prosperity Timeline" icon={Calendar}>
          <div className="space-y-1">
            {prosperityPeriods.map((p, i) => {
              const desc = PROSPERITY_LEVELS[p.level as ProsperityLevel];
              const isCurrent =
                age !== null && age >= p.fromAge && age <= p.toAge;
              const levelColor = LEVEL_COLORS[p.level] ?? "#6b7280";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                    isCurrent && "border bg-muted/50"
                  )}
                >
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: levelColor }}
                  >
                    {p.level}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {p.fromAge}–{p.toAge}
                  </span>
                  <span className="flex-1 truncate">
                    {desc
                      ? (desc as Record<string, string>).en
                      : `Level ${p.level}`}
                  </span>
                  {isCurrent && (
                    <Badge variant="default" className="ml-auto text-[9px]">
                      Now
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {potensiUrip !== null && (
        <Section title="Urip Analysis" icon={Sparkles}>
          <div className="space-y-0.5 rounded-md border p-3">
            <StatRow label="Urip Potensi" value={potensiUrip} />
            <Progress
              value={(potensiUrip / MAX_URIP) * FULL_SCORE}
              className="h-2"
            />
            {peluangUrip !== null && (
              <>
                <StatRow label="Urip Peluang (Today)" value={peluangUrip} />
                <Progress
                  value={(peluangUrip / MAX_URIP) * FULL_SCORE}
                  className="h-2"
                />
              </>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ── Private Helper ──────────────────────────────────── */

function formatNetWorth(billions: number): string {
  if (billions >= 1) return `$${billions.toFixed(1)}B`;
  const millions = billions * 1000;
  return `$${millions.toFixed(0)}M`;
}
