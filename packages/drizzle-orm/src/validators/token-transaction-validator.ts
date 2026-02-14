import { z } from "zod";

const transactionTypeEnum = z.enum([
  "sol_payment",
  "neptu_payment",
  "sudigital_payment",
  "neptu_reward",
  "neptu_burn",
]);

const readingTypeEnum = z.enum([
  "POTENSI",
  "PELUANG",
  "AI_CHAT",
  "COMPATIBILITY",
]);

const statusEnum = z.enum(["pending", "confirmed", "failed"]);

export const createTokenTransactionSchema = z.object({
  userId: z.string().uuid(),
  txSignature: z.string().min(64).max(128),
  transactionType: transactionTypeEnum,
  readingType: readingTypeEnum.optional(),
  solAmount: z.number().nonnegative().optional(),
  neptuAmount: z.number().nonnegative().optional(),
  sudigitalAmount: z.number().nonnegative().optional(),
  neptuBurned: z.number().nonnegative().optional(),
  neptuRewarded: z.number().nonnegative().optional(),
});

export const updateTokenTransactionStatusSchema = z.object({
  txSignature: z.string().min(64).max(128),
  status: statusEnum,
  confirmedAt: z.string().datetime().optional(),
});

export const getTokenTransactionsByUserSchema = z.object({
  userId: z.string().uuid(),
  transactionType: transactionTypeEnum.optional(),
  status: statusEnum.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreateTokenTransactionInput = z.infer<
  typeof createTokenTransactionSchema
>;
export type UpdateTokenTransactionStatusInput = z.infer<
  typeof updateTokenTransactionStatusSchema
>;
export type GetTokenTransactionsByUserInput = z.infer<
  typeof getTokenTransactionsByUserSchema
>;
