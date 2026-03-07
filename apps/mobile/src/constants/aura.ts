import type { ARView } from "../types";

// Wariga dimension metadata — single source of truth for SoulRadarChart + AR Aura
export const DIM_KEYS = [
  "cipta",
  "rasa",
  "karsa",
  "tindakan",
  "frekuensi",
] as const;
export type DimKey = (typeof DIM_KEYS)[number];

export const DIMENSION_LABELS: Record<DimKey, string> = {
  cipta: "Cipta",
  rasa: "Rasa",
  karsa: "Karsa",
  tindakan: "Tindakan",
  frekuensi: "Frekuensi",
};

export const DIMENSION_EMOJIS: Record<DimKey, string> = {
  cipta: "🧠",
  rasa: "💗",
  karsa: "🤝",
  tindakan: "⚡",
  frekuensi: "📊",
};

// Ordered arrays for indexed access (SoulRadarChart, overlay badges)
export const DIMENSION_LABELS_ORDERED = DIM_KEYS.map(
  (k) => DIMENSION_LABELS[k]
);
export const DIMENSION_EMOJIS_ORDERED = DIM_KEYS.map(
  (k) => DIMENSION_EMOJIS[k]
);

// AR Aura zone colors — body-mapped energy visualization
export const AURA_ZONE_COLORS: Record<DimKey, string> = {
  cipta: "#0EA5E9", // blue — crown (thought)
  rasa: "#EC4899", // pink — heart (emotion)
  karsa: "#F59E0B", // gold — solar plexus (willpower)
  tindakan: "#EF4444", // red — hands/arms (action)
  frekuensi: "#A855F7", // purple — full body pulse (frequency)
};

// AR Aura body zone descriptions
export const AURA_ZONE_LABELS: Record<DimKey, string> = {
  cipta: "Crown",
  rasa: "Heart",
  karsa: "Solar Plexus",
  tindakan: "Hands",
  frekuensi: "Full Body",
};

// AR Feature list — all planned AR experiences
export interface ARFeatureConfig {
  id: ARView;
  title: string;
  subtitle: string;
  icon: string;
  gradient: [string, string];
  available: boolean;
  phase: string;
}

export const AR_FEATURES: ARFeatureConfig[] = [
  {
    id: "orb",
    title: "Neptu Orb 3D",
    subtitle: "Full 3D oracle orb in AR — voice AI in your space",
    icon: "🔮",
    gradient: ["#7C3AED", "#4338CA"],
    available: false,
    phase: "v2.0",
  },
  {
    id: "aura",
    title: "Energy Aura Scanner",
    subtitle: "See your Wuku energy aura overlaid on your body",
    icon: "✨",
    gradient: ["#0EA5E9", "#A855F7"],
    available: true,
    phase: "v2.1",
  },
  {
    id: "garden",
    title: "Habit Garden",
    subtitle: "Watch your habits grow as 3D plants in AR",
    icon: "🌿",
    gradient: ["#059669", "#0D9488"],
    available: false,
    phase: "v2.1",
  },
  {
    id: "mandala",
    title: "Wuku Calendar Mandala",
    subtitle: "3D sacred geometry of the 210-day Wuku cycle",
    icon: "🕉️",
    gradient: ["#E040FB", "#7C3AED"],
    available: false,
    phase: "v3.0",
  },
  {
    id: "tokenRain",
    title: "Token Rain",
    subtitle: "NEPTU tokens rain in AR when claiming rewards",
    icon: "🪙",
    gradient: ["#F59E0B", "#EF4444"],
    available: false,
    phase: "v2.0",
  },
  {
    id: "guardian",
    title: "Kanda Pat Guardian",
    subtitle: "Visualize your Balinese guardian spirit in AR",
    icon: "🛡️",
    gradient: ["#475569", "#1E293B"],
    available: false,
    phase: "v3.0",
  },
];
