import { z } from "zod";

export const checkInSchema = z.object({
  userId: z.string().uuid(),
});

export const getStreakSchema = z.object({
  userId: z.string().uuid(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type GetStreakInput = z.infer<typeof getStreakSchema>;
