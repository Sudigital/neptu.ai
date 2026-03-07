import {
  PERSON_CATEGORIES,
  PERSON_TAGS,
  PERSON_SOURCES,
  PERSON_STATUS,
  PERSON_LIMITS,
  PERSON_GENDERS,
} from "@neptu/shared";
import { z } from "zod";

const categorySchema = z.enum(PERSON_CATEGORIES);
const tagSchema = z.enum(PERSON_TAGS);
const sourceSchema = z.enum(PERSON_SOURCES);
const statusSchema = z.enum(PERSON_STATUS);
const genderSchema = z.enum(PERSON_GENDERS);
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createPersonSchema = z.object({
  name: z.string().min(1).max(PERSON_LIMITS.MAX_NAME_LENGTH),
  lastName: z
    .string()
    .max(PERSON_LIMITS.MAX_LAST_NAME_LENGTH)
    .nullable()
    .optional(),
  slug: z
    .string()
    .max(PERSON_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .nullable()
    .optional(),
  birthday: z.string().regex(dateRegex, "Birthday must be YYYY-MM-DD format"),
  gender: genderSchema.nullable().optional(),
  categories: z
    .array(categorySchema)
    .min(1)
    .max(PERSON_LIMITS.MAX_CATEGORIES_PER_PERSON),
  nationality: z
    .string()
    .max(PERSON_LIMITS.MAX_NATIONALITY_LENGTH)
    .nullable()
    .optional(),
  title: z.string().max(PERSON_LIMITS.MAX_TITLE_LENGTH).nullable().optional(),
  description: z
    .string()
    .max(PERSON_LIMITS.MAX_DESCRIPTION_LENGTH)
    .nullable()
    .optional(),
  imageUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  wikidataId: z
    .string()
    .regex(/^Q\d+$/, "Wikidata ID must be Q followed by digits")
    .nullable()
    .optional(),
  wikipediaUrl: z.string().url().nullable().optional(),
  tags: z
    .array(tagSchema)
    .max(PERSON_LIMITS.MAX_TAGS_PER_PERSON)
    .optional()
    .default([]),
  popularity: z
    .number()
    .int()
    .min(0)
    .max(PERSON_LIMITS.MAX_POPULARITY)
    .nullable()
    .optional(),
  source: sourceSchema,
  sourceUrl: z.string().url().nullable().optional(),
  wukuData: z.record(z.unknown()).nullable().optional(),
  city: z.string().max(PERSON_LIMITS.MAX_CITY_LENGTH).nullable().optional(),
  state: z.string().max(PERSON_LIMITS.MAX_STATE_LENGTH).nullable().optional(),
  bios: z
    .array(z.string().max(PERSON_LIMITS.MAX_BIO_LENGTH))
    .max(PERSON_LIMITS.MAX_BIOS)
    .nullable()
    .optional(),
  abouts: z
    .array(z.string().max(PERSON_LIMITS.MAX_ABOUT_LENGTH))
    .max(PERSON_LIMITS.MAX_ABOUTS)
    .nullable()
    .optional(),
  industries: z
    .array(z.string().max(PERSON_LIMITS.MAX_INDUSTRY_LENGTH))
    .max(PERSON_LIMITS.MAX_INDUSTRIES)
    .nullable()
    .optional(),
  netWorthBillions: z.number().nullable().optional(),
  forbesRank: z.number().int().min(1).nullable().optional(),
  status: statusSchema.optional().default("active"),
  crawledAt: z.string().datetime().nullable().optional(),
});

export const updatePersonSchema = z.object({
  name: z.string().min(1).max(PERSON_LIMITS.MAX_NAME_LENGTH).optional(),
  lastName: z
    .string()
    .max(PERSON_LIMITS.MAX_LAST_NAME_LENGTH)
    .nullable()
    .optional(),
  slug: z
    .string()
    .max(PERSON_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .nullable()
    .optional(),
  birthday: z
    .string()
    .regex(dateRegex, "Birthday must be YYYY-MM-DD format")
    .optional(),
  gender: genderSchema.nullable().optional(),
  categories: z
    .array(categorySchema)
    .min(1)
    .max(PERSON_LIMITS.MAX_CATEGORIES_PER_PERSON)
    .optional(),
  nationality: z
    .string()
    .max(PERSON_LIMITS.MAX_NATIONALITY_LENGTH)
    .nullable()
    .optional(),
  title: z.string().max(PERSON_LIMITS.MAX_TITLE_LENGTH).nullable().optional(),
  description: z
    .string()
    .max(PERSON_LIMITS.MAX_DESCRIPTION_LENGTH)
    .nullable()
    .optional(),
  imageUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  wikipediaUrl: z.string().url().nullable().optional(),
  tags: z.array(tagSchema).max(PERSON_LIMITS.MAX_TAGS_PER_PERSON).optional(),
  popularity: z
    .number()
    .int()
    .min(0)
    .max(PERSON_LIMITS.MAX_POPULARITY)
    .nullable()
    .optional(),
  source: sourceSchema.optional(),
  sourceUrl: z.string().url().nullable().optional(),
  wukuData: z.record(z.unknown()).nullable().optional(),
  city: z.string().max(PERSON_LIMITS.MAX_CITY_LENGTH).nullable().optional(),
  state: z.string().max(PERSON_LIMITS.MAX_STATE_LENGTH).nullable().optional(),
  bios: z
    .array(z.string().max(PERSON_LIMITS.MAX_BIO_LENGTH))
    .max(PERSON_LIMITS.MAX_BIOS)
    .nullable()
    .optional(),
  abouts: z
    .array(z.string().max(PERSON_LIMITS.MAX_ABOUT_LENGTH))
    .max(PERSON_LIMITS.MAX_ABOUTS)
    .nullable()
    .optional(),
  industries: z
    .array(z.string().max(PERSON_LIMITS.MAX_INDUSTRY_LENGTH))
    .max(PERSON_LIMITS.MAX_INDUSTRIES)
    .nullable()
    .optional(),
  netWorthBillions: z.number().nullable().optional(),
  forbesRank: z.number().int().min(1).nullable().optional(),
  status: statusSchema.optional(),
});

export const listPersonsSchema = z.object({
  category: categorySchema.optional(),
  status: statusSchema.optional(),
  source: sourceSchema.optional(),
  search: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  gender: genderSchema.optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
export type ListPersonsInput = z.infer<typeof listPersonsSchema>;
