import type { ApiPricingPlan } from "../schemas/api-pricing-plans";

export interface ApiPlanLimits {
  basicCalls: number;
  aiCalls: number;
  rateLimit: number;
}

export interface ApiOverageRates {
  basicCallNeptu: number;
  basicCallSol: number;
  aiCallNeptu: number;
  aiCallSol: number;
}

export interface ApiPricingPlanDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier: string;
  priceUsd: number;
  priceSol: number | null;
  priceNeptu: number | null;
  billingPeriod: string;
  features: string[];
  limits: ApiPlanLimits;
  overageRates: ApiOverageRates;
  discountPercent: number;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function toApiPricingPlanDTO(plan: ApiPricingPlan): ApiPricingPlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    tier: plan.tier,
    priceUsd: Number(plan.priceUsd),
    priceSol: plan.priceSol ? Number(plan.priceSol) : null,
    priceNeptu: plan.priceNeptu ? Number(plan.priceNeptu) : null,
    billingPeriod: plan.billingPeriod,
    features: (plan.features ?? []) as string[],
    limits: (plan.limits ?? {}) as ApiPlanLimits,
    overageRates: (plan.overageRates ?? {}) as ApiOverageRates,
    discountPercent: plan.discountPercent ?? 0,
    isActive: plan.isActive ?? true,
    isPopular: plan.isPopular ?? false,
    sortOrder: plan.sortOrder ?? 0,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}
