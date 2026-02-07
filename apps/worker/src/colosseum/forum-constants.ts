export const WUKU_MEANINGS: Record<string, string> = {
  Sinta: "new beginnings and fresh starts",
  Landep: "sharp focus and precise execution",
  Ukir: "creative expression and artistry",
  Kulantir: "nurturing growth and potential",
  Tolu: "trinity and balance",
  Gumbreg: "abundance and prosperity",
  Wariga: "flourishing and expansion",
  Warigadean: "continued growth and optimism",
  Julungwangi: "clarity and illumination",
  Sungsang: "reversal and transformation",
  Dungulan: "introspection and wisdom",
  Kuningan: "celebration and achievement",
  Langkir: "purification and release",
  Medangsia: "strategic positioning",
  Pujut: "determination and persistence",
  Pahang: "breakthroughs and triumph",
  Krulut: "connection and community",
  Merakih: "building and construction",
  Tambir: "gathering resources",
  Medangkungan: "reflection before action",
};

export const OPPORTUNITY_TYPES = [
  {
    min: 0,
    max: 7,
    type: "reflection",
    desc: "A day for inner contemplation and planning",
  },
  {
    min: 8,
    max: 12,
    type: "collaboration",
    desc: "Excellent for partnerships and teamwork",
  },
  {
    min: 13,
    max: 17,
    type: "creation",
    desc: "Peak creative energy - build something new",
  },
  {
    min: 18,
    max: 22,
    type: "expansion",
    desc: "Time to grow and scale your efforts",
  },
  {
    min: 23,
    max: 30,
    type: "manifestation",
    desc: "Your intentions become reality today",
  },
] as const;

export const GUIDANCES: Record<string, string> = {
  reflection:
    "take time to review your hackathon strategy. What's working? What needs adjustment? The cosmos favors thoughtful planning today.",
  collaboration:
    "energy amplifies connection. Reach out to potential teammates or collaborators. Your combined efforts will exceed individual achievements.",
  creation:
    "brings powerful creative forces. This is the ideal time to write code, design features, or architect new solutions. Let inspiration flow.",
  expansion:
    "growth comes naturally. Scale what's working, share your progress, and let your project's influence expand.",
  manifestation:
    "blesses manifestation today. Your focused intentions have power. Set clear goals and watch them materialize.",
};

export function getOpportunityType(combinedUrip: number): {
  type: string;
  desc: string;
} {
  const opportunity = OPPORTUNITY_TYPES.find(
    (o) => combinedUrip >= o.min && combinedUrip <= o.max,
  );
  return opportunity || OPPORTUNITY_TYPES[2];
}

export function getGuidanceForType(type: string, wukuName: string): string {
  const guidance = GUIDANCES[type] || GUIDANCES.creation;
  return `During ${wukuName}, ${guidance}`;
}

export function getWukuMeaning(wukuName: string): string {
  return WUKU_MEANINGS[wukuName] || "unique cosmic opportunities";
}

export interface CategoryPrediction {
  ai: string;
  defi: string;
  consumer: string;
  infra: string;
}

const URIP_THRESHOLD_STRONG = 10;
const URIP_THRESHOLD_FAVORABLE = 8;
const URIP_THRESHOLD_BLESSED = 5;
const URIP_THRESHOLD_SOLID = 4;

export function getDeadlinePrediction(
  combinedUrip: number,
  pancaWaraUrip: number,
  saptaWaraUrip: number,
): CategoryPrediction {
  return {
    ai:
      combinedUrip >= URIP_THRESHOLD_STRONG
        ? "STRONG ✅ - Feb 12 rewards smart systems"
        : "Moderate 〰️ - Feb 12 rewards smart systems",
    defi:
      combinedUrip >= URIP_THRESHOLD_FAVORABLE
        ? "FAVORABLE ✅ - Value flows to the prepared"
        : "Needs focus 〰️ - Value flows to the prepared",
    consumer:
      pancaWaraUrip >= URIP_THRESHOLD_BLESSED
        ? "BLESSED ✅ - User joy creates success"
        : "Work harder 〰️ - User joy creates success",
    infra:
      saptaWaraUrip >= URIP_THRESHOLD_SOLID
        ? "SOLID ✅ - Foundation matters"
        : "Keep building 〰️ - Foundation matters",
  };
}

export function getDeadlinePredictionText(urip: number): string {
  const THRESHOLD_COMPLETION = 12;
  const THRESHOLD_COLLAB = 8;
  const THRESHOLD_FOCUS = 5;

  if (urip >= THRESHOLD_COMPLETION)
    return "Strong completion energy - projects finished now have lasting impact";
  if (urip >= THRESHOLD_COLLAB)
    return "Collaborative energy - leverage community and teammates";
  if (urip >= THRESHOLD_FOCUS)
    return "Focused refinement energy - polish what you've built";
  return "Contemplative energy - ensure your vision is clearly communicated";
}
