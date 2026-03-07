import { useMemo } from "react";

import type { DimKey } from "../constants/aura";

import {
  DIM_KEYS,
  DIMENSION_LABELS,
  DIMENSION_EMOJIS,
  AURA_ZONE_COLORS,
  AURA_ZONE_LABELS,
} from "../constants/aura";
import { getProfile } from "../services/storage";
import { computeLocalReading, mapToDimensions } from "../utils/energy-helpers";

export interface AuraZone {
  key: DimKey;
  label: string;
  emoji: string;
  color: string;
  bodyZone: string;
  score: number;
  name: string;
  intensity: number; // 0–1 normalized
}

export interface AuraData {
  zones: AuraZone[];
  dualitas: string;
  afirmasi: string;
  totalEnergy: number;
  maxScore: number;
}

export function useAuraData(): AuraData {
  return useMemo(() => {
    const profile = getProfile();
    const birthDate = profile?.birthDate
      ? new Date(`${profile.birthDate}T00:00:00`)
      : null;
    const today = new Date();

    const reading = computeLocalReading(today, birthDate);
    const dims = mapToDimensions(reading.peluang);

    // Find max score for normalization
    let maxScore = 1;
    for (const k of DIM_KEYS) {
      maxScore = Math.max(maxScore, dims[k].value);
    }

    const zones: AuraZone[] = DIM_KEYS.map((k) => ({
      key: k,
      label: DIMENSION_LABELS[k],
      emoji: DIMENSION_EMOJIS[k],
      color: AURA_ZONE_COLORS[k],
      bodyZone: AURA_ZONE_LABELS[k],
      score: dims[k].value,
      name: dims[k].name,
      intensity: dims[k].value / maxScore,
    }));

    const totalEnergy = zones.reduce((sum, z) => sum + z.score, 0);

    return {
      zones,
      dualitas: dims.dualitas,
      afirmasi: dims.afirmasi,
      totalEnergy,
      maxScore,
    };
  }, []);
}
