import { MARKET_CATEGORIES, PERSON_TAGS } from "@neptu/shared";
import { z } from "zod";

export const createMarketCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .max(20)
    .regex(/^#[0-9a-fA-F]{3,8}$/, "Color must be a valid hex color")
    .optional(),
  category: z.enum(MARKET_CATEGORIES),
  personTags: z.array(z.enum(PERSON_TAGS)).default([]),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateMarketCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z
    .string()
    .max(20)
    .regex(/^#[0-9a-fA-F]{3,8}$/, "Color must be a valid hex color")
    .optional()
    .nullable(),
  category: z.enum(MARKET_CATEGORIES).optional(),
  personTags: z.array(z.enum(PERSON_TAGS)).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateMarketCategoryInput = z.infer<
  typeof createMarketCategorySchema
>;
export type UpdateMarketCategoryInput = z.infer<
  typeof updateMarketCategorySchema
>;
