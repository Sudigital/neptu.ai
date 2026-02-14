import { z } from "zod";

const rewardTypeEnum = z.enum([
  "daily_check_in",
  "streak_bonus",
  "first_reading",
  "referral",
  "referee_bonus",
  "social_share",
  "auspicious_day",
  "payment_reward",
]);

const rewardStatusEnum = z.enum(["pending", "claimed", "expired"]);

export const createUserRewardSchema = z.object({
  userId: z.string().uuid(),
  rewardType: rewardTypeEnum,
  neptuAmount: z.number().positive(),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const claimUserRewardSchema = z.object({
  rewardId: z.string().uuid(),
  claimTxSignature: z.string().min(64).max(128),
});

export const getUserRewardsSchema = z.object({
  userId: z.string().uuid(),
  status: rewardStatusEnum.optional(),
  rewardType: rewardTypeEnum.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreateUserRewardInput = z.infer<typeof createUserRewardSchema>;
export type ClaimUserRewardInput = z.infer<typeof claimUserRewardSchema>;
export type GetUserRewardsInput = z.infer<typeof getUserRewardsSchema>;
