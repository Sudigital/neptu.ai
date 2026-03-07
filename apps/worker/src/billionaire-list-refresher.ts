import type { PersonCategory, PersonTag } from "@neptu/shared";

import { type Database, PersonService } from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import { BILLIONAIRE_TRACKING } from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";

const log = createLogger({ name: "billionaire-list-refresh" });

const FORBES_API =
  "https://www.forbes.com/forbesapi/person/rtb/0/position/true.json";
const FORBES_LIMIT = BILLIONAIRE_TRACKING.FORBES_LIMIT;

/* ── Forbes API response shape ───────────────────────── */

interface ForbesPersonRaw {
  rank: number;
  personName: string;
  finalWorth: number;
  estWorthPrev: number;
  uri: string;
  industries?: string[];
  countryOfCitizenship?: string;
  source?: string;
  squareImage?: string;
  birthDate?: number;
  bios?: string[];
}

/* ── Industry → our tags ─────────────────────────────── */

const INDUSTRY_TAG_MAP: Record<string, PersonTag[]> = {
  technology: ["tech"],
  "fashion & retail": ["luxury", "ecommerce"],
  fashion: ["luxury"],
  retail: ["ecommerce"],
  finance: ["finance"],
  "finance & investments": ["finance", "asset_management"],
  "food & beverage": ["manufacturing"],
  energy: ["energy"],
  "media & entertainment": ["media"],
  media: ["media"],
  entertainment: ["media"],
  healthcare: ["healthcare"],
  manufacturing: ["manufacturing"],
  automotive: ["ev", "manufacturing"],
  diversified: [],
  "real estate": ["real_estate"],
  metals: ["manufacturing"],
  "mining & metals": ["manufacturing"],
  telecom: ["telecom"],
  telecommunications: ["telecom"],
  service: [],
  logistics: ["manufacturing"],
  "construction & engineering": ["real_estate"],
  sports: ["media"],
  "gambling & casinos": [],
  insurance: ["finance"],
  banking: ["banking", "finance"],
  semiconductors: ["semiconductor"],
  software: ["tech"],
  "internet services": ["tech"],
  "consumer goods": ["ecommerce"],
};

function mapIndustryToTags(industries: string[]): PersonTag[] {
  const tags = new Set<PersonTag>();
  for (const industry of industries) {
    const mapped = INDUSTRY_TAG_MAP[industry.toLowerCase().trim()];
    if (mapped) mapped.forEach((t) => tags.add(t));
  }
  return [...tags];
}

function toBirthday(ts?: number): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeImageUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function computeWukuData(birthday: string): Record<string, unknown> | null {
  try {
    const calculator = new NeptuCalculator();
    const reading = calculator.getFullReading(new Date(birthday));
    return reading as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ── Main: refresh billionaire person list from Forbes ── */

export async function refreshBillionaireList(
  db: Database
): Promise<{ updated: number; inserted: number; skipped: number }> {
  log.info("Refreshing billionaire list from Forbes API");

  /* 1. Fetch Forbes API */
  const url = `${FORBES_API}?limit=${FORBES_LIMIT}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": BILLIONAIRE_TRACKING.USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Forbes API HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    personList: { personsLists: ForbesPersonRaw[] };
  };
  const forbesPeople = data.personList?.personsLists ?? [];
  log.info({ count: forbesPeople.length }, "Forbes API fetched");

  /* 2. Load existing persons */
  const service = new PersonService(db);
  const existing = await service.list({ status: "active", limit: 1000 });

  const nameMap = new Map(existing.map((p) => [normalizeName(p.name), p]));
  const exactNameSet = new Set(existing.map((p) => p.name));

  let updated = 0;
  let inserted = 0;
  let skipped = 0;

  /* 3. Match and update/insert */
  for (const raw of forbesPeople) {
    const key = normalizeName(raw.personName);
    const match = nameMap.get(key);
    const birthday = toBirthday(raw.birthDate);
    const tags = mapIndustryToTags(raw.industries ?? []);
    const imageUrl = normalizeImageUrl(raw.squareImage);
    const profileUrl = `https://www.forbes.com/profile/${raw.uri}/`;

    if (match) {
      /* Update existing person: upgrade source, merge categories/tags */
      const existingCats = (match.categories ?? []) as PersonCategory[];
      const mergedCats = existingCats.includes("billionaire")
        ? existingCats
        : ([...existingCats, "billionaire"] as PersonCategory[]);

      const existingTags = (match.tags ?? []) as PersonTag[];
      const mergedTags = [
        ...new Set([...existingTags, ...tags]),
      ] as PersonTag[];

      try {
        await service.update(match.id, {
          categories: mergedCats,
          tags: mergedTags,
          popularity: raw.rank,
          source: "forbes",
          sourceUrl: profileUrl,
          imageUrl: match.imageUrl ?? imageUrl,
        });
        updated++;
      } catch (error) {
        log.warn({ name: raw.personName, error }, "Failed to update");
        skipped++;
      }
    } else if (birthday && !exactNameSet.has(raw.personName)) {
      /* Insert new billionaire */
      const wukuData = computeWukuData(birthday);

      try {
        await service.create({
          name: raw.personName,
          birthday,
          categories: ["billionaire"],
          tags,
          nationality: raw.countryOfCitizenship ?? null,
          title: raw.source ? `Source: ${raw.source}` : null,
          description: raw.bios?.[0]?.trim() ?? null,
          imageUrl,
          popularity: raw.rank,
          source: "forbes",
          sourceUrl: profileUrl,
          wukuData,
          status: "active",
          crawledAt: new Date().toISOString(),
        });
        inserted++;
        exactNameSet.add(raw.personName);
      } catch (error) {
        log.warn({ name: raw.personName, error }, "Failed to insert");
        skipped++;
      }
    } else {
      skipped++;
    }
  }

  log.info(
    { updated, inserted, skipped, total: forbesPeople.length },
    "Billionaire list refresh complete"
  );

  return { updated, inserted, skipped };
}
