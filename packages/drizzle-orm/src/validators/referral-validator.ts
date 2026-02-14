import { z } from "zod";

export const createReferralSchema = z.object({
  referrerId: z.string().uuid(),
  refereeId: z.string().uuid(),
});

export const getReferralsByUserSchema = z.object({
  userId: z.string().uuid(),
  asReferrer: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const completeReferralSchema = z.object({
  referralId: z.string().uuid(),
  referrerTxSignature: z.string().min(64).max(128).optional(),
  refereeTxSignature: z.string().min(64).max(128).optional(),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type GetReferralsByUserInput = z.infer<typeof getReferralsByUserSchema>;
export type CompleteReferralInput = z.infer<typeof completeReferralSchema>;
