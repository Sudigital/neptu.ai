import type { MarketCategory, PersonTag } from "@neptu/shared";

import type { MarketCategoryRow } from "../schemas/market-categories";

export interface MarketCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  category: MarketCategory;
  personTags: PersonTag[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function toMarketCategoryDTO(row: MarketCategoryRow): MarketCategoryDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    color: row.color,
    category: row.category,
    personTags: (row.personTags ?? []) as PersonTag[],
    isActive: row.isActive ?? true,
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toMarketCategoryDTOList(
  rows: MarketCategoryRow[]
): MarketCategoryDTO[] {
  return rows.map(toMarketCategoryDTO);
}
