import type { PricingPlan } from "../schemas/pricing-plans";

export interface PricingPlanDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceUsd: number;
  priceSol: number | null;
  priceNeptu: number | null;
  priceSudigital: number | null;
  features: string[];
  limits: PlanLimits;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  dailyReadings: number; // -1 for unlimited
  oracleChats: number; // -1 for unlimited
  customReadings: number; // -1 for unlimited
  advancedInsights: boolean;
  prioritySupport: boolean;
}

export function toPricingPlanDTO(plan: PricingPlan): PricingPlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceUsd: Number(plan.priceUsd),
    priceSol: plan.priceSol ? Number(plan.priceSol) : null,
    priceNeptu: plan.priceNeptu ? Number(plan.priceNeptu) : null,
    priceSudigital: plan.priceSudigital ? Number(plan.priceSudigital) : null,
    features: (plan.features ?? []) as string[],
    limits: (plan.limits ?? {}) as PlanLimits,
    isActive: plan.isActive ?? true,
    isPopular: plan.isPopular ?? false,
    sortOrder: plan.sortOrder ?? 0,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}
