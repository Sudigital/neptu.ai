import { z } from "zod";

const apiPlanLimitsSchema = z.object({
  basicCalls: z.number().int().min(-1),
  aiCalls: z.number().int().min(-1),
  rateLimit: z.number().int().min(1),
});

const apiOverageRatesSchema = z.object({
  basicCallNeptu: z.number().min(0),
  basicCallSol: z.number().min(0),
  aiCallNeptu: z.number().min(0),
  aiCallSol: z.number().min(0),
});

export const createApiPricingPlanSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  tier: z.enum(["starter", "pro", "business", "enterprise"]),
  priceUsd: z.number().min(0),
  priceSol: z.number().min(0).optional(),
  priceNeptu: z.number().min(0).optional(),
  billingPeriod: z.enum(["monthly", "yearly"]).default("monthly"),
  features: z.array(z.string()),
  limits: apiPlanLimitsSchema,
  overageRates: apiOverageRatesSchema,
  discountPercent: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateApiPricingPlanSchema = createApiPricingPlanSchema.partial();

export type CreateApiPricingPlanInput = z.infer<
  typeof createApiPricingPlanSchema
>;
export type UpdateApiPricingPlanInput = z.infer<
  typeof updateApiPricingPlanSchema
>;
export type ApiPlanLimitsInput = z.infer<typeof apiPlanLimitsSchema>;
export type ApiOverageRatesInput = z.infer<typeof apiOverageRatesSchema>;
