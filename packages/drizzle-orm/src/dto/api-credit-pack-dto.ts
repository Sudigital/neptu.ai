import type { ApiCreditPack } from "../schemas/api-credit-packs";

export interface ApiCreditPackDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  credits: number;
  aiCredits: number;
  priceUsd: number;
  priceSol: number | null;
  priceNeptu: number | null;
  bonusPercent: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function toApiCreditPackDTO(pack: ApiCreditPack): ApiCreditPackDTO {
  return {
    id: pack.id,
    name: pack.name,
    slug: pack.slug,
    description: pack.description,
    credits: pack.credits,
    aiCredits: pack.aiCredits,
    priceUsd: Number(pack.priceUsd),
    priceSol: pack.priceSol ? Number(pack.priceSol) : null,
    priceNeptu: pack.priceNeptu ? Number(pack.priceNeptu) : null,
    bonusPercent: pack.bonusPercent ?? 0,
    isActive: pack.isActive ?? true,
    sortOrder: pack.sortOrder ?? 0,
    createdAt: pack.createdAt.toISOString(),
    updatedAt: pack.updatedAt.toISOString(),
  };
}
