import type { PersonCategory, PersonGender, PersonTag } from "@neptu/shared";

import { BILLIONAIRES_SEED } from "./01-person-billionaire.seed";
import { INVESTORS_SEED } from "./02-person-investor.seed";
import { CENTRAL_BANKERS_SEED } from "./03-person-banker.seed";
import { ENTREPRENEURS_SEED } from "./04-person-entrepreneur.seed";
import { INFLUENCERS_SEED } from "./05-person-influencer.seed";
import { ACTIVE_PRESIDENTS } from "./06-person-president.seed";

export interface SeededPerson {
  name: string;
  birthday: string;
  categories: PersonCategory[];
  tags?: PersonTag[];
  nationality: string;
  title: string;
  description: string;
  imageUrl: string | null;
  wikidataId: string | null;
  wikipediaUrl: string | null;
  popularity?: number | null;
  source: "manual" | "forbes";
  sourceUrl: string | null;
  lastName?: string | null;
  slug?: string | null;
  gender?: PersonGender | null;
  netWorthBillions?: number | null;
  forbesRank?: number | null;
  industries?: string[] | null;
  bios?: string[] | null;
  abouts?: string[] | null;
  thumbnailUrl?: string | null;
  city?: string | null;
  state?: string | null;
}

/* Billionaires first (priority), then other categories */
export const POWERFUL_PEOPLE_SEED: SeededPerson[] = [
  ...BILLIONAIRES_SEED,
  ...INVESTORS_SEED,
  ...CENTRAL_BANKERS_SEED,
  ...ENTREPRENEURS_SEED,
  ...INFLUENCERS_SEED,
  ...ACTIVE_PRESIDENTS,
];

export { BILLIONAIRES_SEED } from "./01-person-billionaire.seed";
export { INVESTORS_SEED } from "./02-person-investor.seed";
export { CENTRAL_BANKERS_SEED } from "./03-person-banker.seed";
export { ENTREPRENEURS_SEED } from "./04-person-entrepreneur.seed";
export { INFLUENCERS_SEED } from "./05-person-influencer.seed";
export { ACTIVE_PRESIDENTS } from "./06-person-president.seed";
