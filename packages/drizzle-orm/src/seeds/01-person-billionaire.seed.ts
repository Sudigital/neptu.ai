import type { PersonCategory, PersonGender, PersonTag } from "@neptu/shared";

import type { SeededPerson } from "./index";

import forbesData from "./data/forbes-billionaires.json";

interface ForbesRaw {
  rank: number;
  name: string;
  lastName: string | null;
  slug: string;
  birthday: string | null;
  gender: string | null;
  netWorthBillions: number;
  profileSlug: string;
  country: string | null;
  state: string | null;
  city: string | null;
  industries: string[];
  wealthSource: string | null;
  description: string | null;
  bios: string[];
  abouts: string[];
  imageUrl: string | null;
  thumbnailUrl: string | null;
  categories: PersonCategory[];
  tags: PersonTag[];
}

function toGender(raw: string | null): PersonGender | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "M" || upper === "F" || upper === "O") return upper;
  return null;
}

function mapBillionaire(raw: ForbesRaw): SeededPerson {
  return {
    name: raw.name,
    birthday: raw.birthday!,
    categories: raw.categories as PersonCategory[],
    tags: raw.tags,
    nationality: raw.country ?? "Unknown",
    title: raw.wealthSource ? `Source: ${raw.wealthSource}` : "Billionaire",
    description: raw.description ?? `Forbes billionaire ranked #${raw.rank}`,
    imageUrl: raw.imageUrl,
    thumbnailUrl: raw.thumbnailUrl,
    wikidataId: null,
    wikipediaUrl: null,
    popularity: raw.rank,
    source: "forbes",
    sourceUrl: `https://www.forbes.com/profile/${raw.slug}/`,
    lastName: raw.lastName,
    slug: raw.slug,
    gender: toGender(raw.gender),
    netWorthBillions: raw.netWorthBillions,
    forbesRank: raw.rank,
    industries: raw.industries.length > 0 ? raw.industries : null,
    bios: raw.bios.length > 0 ? raw.bios : null,
    abouts: raw.abouts.length > 0 ? raw.abouts : null,
    city: raw.city,
    state: raw.state,
  };
}

export const BILLIONAIRES_SEED: SeededPerson[] = (forbesData as ForbesRaw[])
  .filter((b) => b.birthday)
  .map(mapBillionaire);
