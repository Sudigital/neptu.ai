import { z } from "zod";

const paymentTypeEnum = z.enum(["sol", "neptu"]);
const paymentStatusEnum = z.enum(["pending", "confirmed", "failed"]);

export const createPaymentSchema = z.object({
  userId: z.string().uuid(),
  readingId: z.string().uuid().optional(),
  paymentType: paymentTypeEnum,
  amount: z.number().positive(),
  neptuReward: z.number().nonnegative().optional(),
  neptuBurned: z.number().nonnegative().optional(),
  txSignature: z.string().min(64).max(128),
});

export const updatePaymentStatusSchema = z.object({
  txSignature: z.string().min(64).max(128),
  status: paymentStatusEnum,
  confirmedAt: z.string().datetime().optional(),
});

export const getPaymentsByUserSchema = z.object({
  userId: z.string().uuid(),
  status: paymentStatusEnum.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;
export type GetPaymentsByUserInput = z.infer<typeof getPaymentsByUserSchema>;
