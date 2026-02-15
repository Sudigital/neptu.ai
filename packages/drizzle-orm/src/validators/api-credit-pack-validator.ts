import { z } from "zod";

export const createApiCreditPackSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  credits: z.number().int().min(1),
  aiCredits: z.number().int().min(0).default(0),
  priceUsd: z.number().min(0),
  priceSol: z.number().min(0).optional(),
  priceNeptu: z.number().min(0).optional(),
  bonusPercent: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateApiCreditPackSchema = createApiCreditPackSchema.partial();

export type CreateApiCreditPackInput = z.infer<
  typeof createApiCreditPackSchema
>;
export type UpdateApiCreditPackInput = z.infer<
  typeof updateApiCreditPackSchema
>;
