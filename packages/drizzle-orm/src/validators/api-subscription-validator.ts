import { z } from "zod";

export const createApiSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  paymentMethod: z.enum(["sol", "neptu", "sudigital"]),
  paymentTxSignature: z.string().optional(),
});

export const updateApiSubscriptionSchema = z.object({
  status: z.enum(["active", "paused", "cancelled", "expired"]).optional(),
  creditsRemaining: z.number().int().min(0).optional(),
  aiCreditsRemaining: z.number().int().min(0).optional(),
});

export type CreateApiSubscriptionInput = z.infer<
  typeof createApiSubscriptionSchema
>;
export type UpdateApiSubscriptionInput = z.infer<
  typeof updateApiSubscriptionSchema
>;
