import {
  HABIT_CATEGORIES,
  HABIT_FREQUENCIES,
  HABIT_LIMITS,
  HABIT_REWARDS,
} from "@neptu/shared";
import { z } from "zod";

const categorySchema = z.enum(HABIT_CATEGORIES);
const frequencySchema = z.enum(HABIT_FREQUENCIES);
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createHabitSchema = z.object({
  title: z.string().min(1).max(HABIT_LIMITS.MAX_TITLE_LENGTH),
  description: z
    .string()
    .max(HABIT_LIMITS.MAX_DESCRIPTION_LENGTH)
    .optional()
    .default(""),
  category: categorySchema,
  frequency: frequencySchema,
  targetCount: z
    .number()
    .int()
    .min(1)
    .max(HABIT_LIMITS.MAX_TARGET_COUNT)
    .optional()
    .default(1),
  scheduledTime: z
    .string()
    .regex(timeRegex, "Time must be HH:MM format")
    .nullable()
    .optional(),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .optional()
    .default([0, 1, 2, 3, 4, 5, 6]),
  tokenReward: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .default(HABIT_REWARDS.COMPLETION),
});

export const updateHabitSchema = z.object({
  title: z.string().min(1).max(HABIT_LIMITS.MAX_TITLE_LENGTH).optional(),
  description: z.string().max(HABIT_LIMITS.MAX_DESCRIPTION_LENGTH).optional(),
  category: categorySchema.optional(),
  frequency: frequencySchema.optional(),
  targetCount: z
    .number()
    .int()
    .min(1)
    .max(HABIT_LIMITS.MAX_TARGET_COUNT)
    .optional(),
  scheduledTime: z
    .string()
    .regex(timeRegex, "Time must be HH:MM format")
    .nullable()
    .optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  tokenReward: z.number().min(0).max(10).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const completeHabitSchema = z.object({
  count: z
    .number()
    .int()
    .min(1)
    .max(HABIT_LIMITS.MAX_DAILY_COMPLETIONS)
    .optional()
    .default(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
});

export const getHabitsSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["active", "archived", "all"]).optional().default("active"),
});

export const getCompletionsSchema = z.object({
  userId: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
  habitId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type CompleteHabitInput = z.infer<typeof completeHabitSchema>;
export type GetHabitsInput = z.infer<typeof getHabitsSchema>;
export type GetCompletionsInput = z.infer<typeof getCompletionsSchema>;
