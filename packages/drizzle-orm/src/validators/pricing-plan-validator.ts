import { z } from "zod";

const planLimitsSchema = z.object({
  dailyReadings: z.number().int(), // -1 for unlimited
  oracleChats: z.number().int(), // -1 for unlimited
  customReadings: z.number().int(), // -1 for unlimited
  advancedInsights: z.boolean(),
  prioritySupport: z.boolean(),
});

export const createPricingPlanSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  priceUsd: z.number().min(0),
  priceSol: z.number().min(0).optional(),
  priceNeptu: z.number().min(0).optional(),
  priceSudigital: z.number().min(0).optional(),
  features: z.array(z.string()),
  limits: planLimitsSchema,
  isActive: z.boolean().optional().default(true),
  isPopular: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export const updatePricingPlanSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(500).optional().nullable(),
  priceUsd: z.number().min(0).optional(),
  priceSol: z.number().min(0).optional().nullable(),
  priceNeptu: z.number().min(0).optional().nullable(),
  priceSudigital: z.number().min(0).optional().nullable(),
  features: z.array(z.string()).optional(),
  limits: planLimitsSchema.optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreatePricingPlanInput = z.infer<typeof createPricingPlanSchema>;
export type UpdatePricingPlanInput = z.infer<typeof updatePricingPlanSchema>;
export type PlanLimitsInput = z.infer<typeof planLimitsSchema>;
