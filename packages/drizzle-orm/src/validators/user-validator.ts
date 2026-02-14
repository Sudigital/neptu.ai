import { z } from "zod";
import { DATE_REGEX, USER_INTERESTS } from "@neptu/shared";

const interestSchema = z.enum(USER_INTERESTS);

export const createUserSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(50).optional(),
  birthDate: z
    .string()
    .regex(DATE_REGEX, "Date must be YYYY-MM-DD format")
    .optional(),
  interests: z.array(interestSchema).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(50).optional(),
  interests: z.array(interestSchema).optional(),
  birthDate: z
    .string()
    .regex(DATE_REGEX, "Date must be YYYY-MM-DD format")
    .optional(),
});

// Onboarding schema - birthday is required, interests optional
export const onboardUserSchema = z.object({
  birthDate: z.string().regex(DATE_REGEX, "Date must be YYYY-MM-DD format"),
  displayName: z.string().min(1).max(50).optional(),
  interests: z.array(interestSchema).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type OnboardUserInput = z.infer<typeof onboardUserSchema>;
