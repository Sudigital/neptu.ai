import type { ApiSubscription } from "../schemas/api-subscriptions";

export interface ApiSubscriptionDTO {
  id: string;
  userId: string;
  planId: string;
  status: string;
  creditsRemaining: number;
  aiCreditsRemaining: number;
  billingCycleStart: string;
  billingCycleEnd: string;
  paymentMethod: string | null;
  paymentTxSignature: string | null;
  metadata: Record<string, unknown> | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toApiSubscriptionDTO(sub: ApiSubscription): ApiSubscriptionDTO {
  return {
    id: sub.id,
    userId: sub.userId,
    planId: sub.planId,
    status: sub.status,
    creditsRemaining: sub.creditsRemaining,
    aiCreditsRemaining: sub.aiCreditsRemaining,
    billingCycleStart: sub.billingCycleStart.toISOString(),
    billingCycleEnd: sub.billingCycleEnd.toISOString(),
    paymentMethod: sub.paymentMethod,
    paymentTxSignature: sub.paymentTxSignature,
    metadata: sub.metadata as Record<string, unknown> | null,
    cancelledAt: sub.cancelledAt?.toISOString() ?? null,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}
