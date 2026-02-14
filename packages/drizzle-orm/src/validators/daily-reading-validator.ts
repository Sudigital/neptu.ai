import { z } from "zod";
import { DATE_REGEX } from "@neptu/shared";

export const createDailyReadingSchema = z.object({
  date: z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD format"),
  type: z.enum(["peluang"]),
  readingData: z.string(),
});

export const getDailyReadingSchema = z.object({
  date: z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD format"),
  type: z.enum(["peluang"]),
});

export type CreateDailyReadingInput = z.infer<typeof createDailyReadingSchema>;
export type GetDailyReadingInput = z.infer<typeof getDailyReadingSchema>;
