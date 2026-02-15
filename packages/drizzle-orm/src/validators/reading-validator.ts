import { DATE_REGEX } from "@neptu/shared";
import { z } from "zod";

const readingTypeEnum = z.enum(["potensi", "peluang", "compatibility"]);

export const createReadingSchema = z.object({
  userId: z.string().uuid(),
  type: readingTypeEnum,
  targetDate: z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD format"),
  birthDate: z
    .string()
    .regex(DATE_REGEX, "Date must be YYYY-MM-DD format")
    .optional(),
  birthDate2: z
    .string()
    .regex(DATE_REGEX, "Date must be YYYY-MM-DD format")
    .optional(),
  readingData: z.string(),
  txSignature: z.string().optional(),
});

export const getReadingsByUserSchema = z.object({
  userId: z.string().uuid(),
  type: readingTypeEnum.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type GetReadingsByUserInput = z.infer<typeof getReadingsByUserSchema>;
