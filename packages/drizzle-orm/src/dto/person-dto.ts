import type {
  PersonCategory,
  PersonGender,
  PersonSource,
  PersonStatus,
  PersonTag,
} from "@neptu/shared";

import type { Person } from "../schemas/persons";

export interface PersonDTO {
  id: string;
  name: string;
  lastName: string | null;
  slug: string | null;
  birthday: string;
  gender: PersonGender | null;
  categories: PersonCategory[];
  nationality: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  wikidataId: string | null;
  wikipediaUrl: string | null;
  tags: PersonTag[];
  popularity: number | null;
  source: PersonSource;
  sourceUrl: string | null;
  wukuData: Record<string, unknown> | null;
  city: string | null;
  state: string | null;
  bios: string[] | null;
  abouts: string[] | null;
  industries: string[] | null;
  netWorthBillions: number | null;
  forbesRank: number | null;
  status: PersonStatus;
  crawledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toPersonDTO(figure: Person): PersonDTO {
  return {
    id: figure.id,
    name: figure.name,
    lastName: figure.lastName,
    slug: figure.slug,
    birthday: figure.birthday,
    gender: figure.gender,
    categories: (figure.categories ?? ["world_leader"]) as PersonCategory[],
    nationality: figure.nationality,
    title: figure.title,
    description: figure.description,
    imageUrl: figure.imageUrl,
    thumbnailUrl: figure.thumbnailUrl,
    wikidataId: figure.wikidataId,
    wikipediaUrl: figure.wikipediaUrl,
    tags: (figure.tags ?? []) as PersonTag[],
    popularity: figure.popularity,
    source: figure.source,
    sourceUrl: figure.sourceUrl,
    wukuData: figure.wukuData as Record<string, unknown> | null,
    city: figure.city,
    state: figure.state,
    bios: figure.bios,
    abouts: figure.abouts,
    industries: figure.industries,
    netWorthBillions: figure.netWorthBillions,
    forbesRank: figure.forbesRank,
    status: figure.status,
    crawledAt: figure.crawledAt?.toISOString() ?? null,
    createdAt: figure.createdAt.toISOString(),
    updatedAt: figure.updatedAt.toISOString(),
  };
}

export function toPersonDTOList(figures: Person[]): PersonDTO[] {
  return figures.map(toPersonDTO);
}
