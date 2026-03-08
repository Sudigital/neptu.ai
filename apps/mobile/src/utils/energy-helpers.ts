import type { Peluang, Potensi } from "@neptu/shared";

import { NeptuCalculator } from "@neptu/wariga";

export interface DimValue {
  value: number;
  name: string;
}

export interface SoulDimensions {
  cipta: DimValue;
  rasa: DimValue;
  karsa: DimValue;
  tindakan: DimValue;
  frekuensi: DimValue;
  dualitas: string;
  afirmasi: string;
}

export interface ReadingData {
  potensi: Potensi | null;
  peluang: Peluang;
}

export interface CardTheme {
  bg: string;
  gradient: [string, string, string];
  title: string;
  icon: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    bg: "#475569",
    gradient: ["#475569", "#64748B", "#334155"],
    title: "Past Reading",
    icon: "\u{1F4C5}",
  },
  {
    bg: "#7C3AED",
    gradient: ["#7C3AED", "#9333EA", "#4338CA"],
    title: "Today's Alignment",
    icon: "\u2728",
  },
  {
    bg: "#0D9488",
    gradient: ["#059669", "#0D9488", "#0E7490"],
    title: "Future Prediction",
    icon: "\u2B50",
  },
];

export const DAY_LABELS = ["Yesterday", "Today", "Tomorrow"];
export const DAY_OFFSETS = [-1, 0, 1] as const;

const calculator = new NeptuCalculator();

export function titleCase(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function mapToDimensions(r: Potensi | Peluang): SoulDimensions {
  const dim = (
    field: { value?: number; name?: string } | undefined | null
  ): DimValue => ({
    value: field?.value ?? 0,
    name: titleCase(field?.name ?? ""),
  });

  return {
    cipta: dim(r.cipta),
    rasa: dim(r.rasa),
    karsa: dim(r.karsa),
    tindakan: dim(r.tindakan),
    frekuensi: dim(r.frekuensi),
    dualitas: r.dualitas ?? "YIN",
    afirmasi: r.afirmasi?.name ?? "",
  };
}

export function computeLocalReading(
  targetDate: Date,
  birthDate: Date | null
): ReadingData {
  const targetStr = toDateString(targetDate);
  const apiStyleTarget = new Date(targetStr);
  const peluang = birthDate
    ? calculator.calculatePeluang(
        apiStyleTarget,
        new Date(toDateString(birthDate))
      )
    : calculator.calculatePeluang(apiStyleTarget);
  const potensi = birthDate
    ? calculator.calculatePotensi(new Date(toDateString(birthDate)))
    : null;
  return { potensi, peluang };
}
