import type { Database } from "../client";
import type { ApiPlanLimits } from "../dto/api-pricing-plan-dto";

import {
  toApiSubscriptionDTO,
  type ApiSubscriptionDTO,
} from "../dto/api-subscription-dto";
import { ApiPricingPlanRepository } from "../repositories/api-pricing-plan-repository";
import {
  ApiSubscriptionRepository,
  type ListSubscriptionsOptions,
  type PaginatedResult,
} from "../repositories/api-subscription-repository";
import {
  createApiSubscriptionSchema,
  type CreateApiSubscriptionInput,
} from "../validators/api-subscription-validator";

export class ApiSubscriptionService {
  private repository: ApiSubscriptionRepository;
  private planRepository: ApiPricingPlanRepository;

  constructor(db: Database) {
    this.repository = new ApiSubscriptionRepository(db);
    this.planRepository = new ApiPricingPlanRepository(db);
  }

  async createSubscription(
    userId: string,
    input: CreateApiSubscriptionInput
  ): Promise<ApiSubscriptionDTO> {
    const validated = createApiSubscriptionSchema.parse(input);
    const id = crypto.randomUUID();

    const plan = await this.planRepository.findById(validated.planId);
    if (!plan) {
      throw new Error("Invalid plan ID");
    }

    const limits = plan.limits as ApiPlanLimits;
    const now = new Date();
    const billingCycleEnd = new Date(now);

    if (plan.billingPeriod === "monthly") {
      billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1);
    } else {
      billingCycleEnd.setFullYear(billingCycleEnd.getFullYear() + 1);
    }

    const subscription = await this.repository.create({
      id,
      userId,
      planId: validated.planId,
      status: "active",
      creditsRemaining: limits.basicCalls,
      aiCreditsRemaining: limits.aiCalls,
      billingCycleStart: now,
      billingCycleEnd,
      paymentMethod: validated.paymentMethod,
      paymentTxSignature: validated.paymentTxSignature ?? null,
    });

    return toApiSubscriptionDTO(subscription);
  }

  async getSubscriptionById(id: string): Promise<ApiSubscriptionDTO | null> {
    const sub = await this.repository.findById(id);
    return sub ? toApiSubscriptionDTO(sub) : null;
  }

  async getSubscriptionsByUserId(
    userId: string
  ): Promise<ApiSubscriptionDTO[]> {
    const subs = await this.repository.findByUserId(userId);
    return subs.map(toApiSubscriptionDTO);
  }

  async getActiveSubscription(
    userId: string
  ): Promise<ApiSubscriptionDTO | null> {
    const sub = await this.repository.findActiveByUserId(userId);
    return sub ? toApiSubscriptionDTO(sub) : null;
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const sub = await this.repository.findActiveByUserId(userId);
    return sub !== null;
  }

  async useCredits(
    userId: string,
    basicCredits: number,
    aiCredits: number
  ): Promise<{ success: boolean; remaining: { basic: number; ai: number } }> {
    const sub = await this.repository.findActiveByUserId(userId);
    if (!sub) {
      return { success: false, remaining: { basic: 0, ai: 0 } };
    }

    if (
      sub.creditsRemaining < basicCredits ||
      sub.aiCreditsRemaining < aiCredits
    ) {
      return {
        success: false,
        remaining: {
          basic: sub.creditsRemaining,
          ai: sub.aiCreditsRemaining,
        },
      };
    }

    const updated = await this.repository.decrementCredits(
      sub.id,
      basicCredits,
      aiCredits
    );

    return {
      success: true,
      remaining: {
        basic: updated?.creditsRemaining ?? 0,
        ai: updated?.aiCreditsRemaining ?? 0,
      },
    };
  }

  async addCredits(
    subscriptionId: string,
    basicCredits: number,
    aiCredits: number
  ): Promise<ApiSubscriptionDTO | null> {
    const sub = await this.repository.findById(subscriptionId);
    if (!sub) return null;

    const updated = await this.repository.updateCredits(
      subscriptionId,
      sub.creditsRemaining + basicCredits,
      sub.aiCreditsRemaining + aiCredits
    );

    return updated ? toApiSubscriptionDTO(updated) : null;
  }

  async renewSubscription(
    subscriptionId: string
  ): Promise<ApiSubscriptionDTO | null> {
    const sub = await this.repository.findById(subscriptionId);
    if (!sub) return null;

    const plan = await this.planRepository.findById(sub.planId);
    if (!plan) return null;

    const limits = plan.limits as ApiPlanLimits;
    const now = new Date();
    const billingCycleEnd = new Date(now);

    if (plan.billingPeriod === "monthly") {
      billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1);
    } else {
      billingCycleEnd.setFullYear(billingCycleEnd.getFullYear() + 1);
    }

    const updated = await this.repository.update(subscriptionId, {
      status: "active",
      creditsRemaining: limits.basicCalls,
      aiCreditsRemaining: limits.aiCalls,
      billingCycleStart: now,
      billingCycleEnd,
    });

    return updated ? toApiSubscriptionDTO(updated) : null;
  }

  async cancelSubscription(
    subscriptionId: string,
    userId: string
  ): Promise<boolean> {
    const sub = await this.repository.findById(subscriptionId);
    if (!sub || sub.userId !== userId) return false;

    await this.repository.cancel(subscriptionId);
    return true;
  }

  async checkAndExpireSubscriptions(): Promise<number> {
    return 0;
  }

  // Admin methods
  async listSubscriptions(
    options: ListSubscriptionsOptions
  ): Promise<PaginatedResult<ApiSubscriptionDTO>> {
    const result = await this.repository.list(options);
    return {
      ...result,
      data: result.data.map(toApiSubscriptionDTO),
    };
  }

  async updateSubscription(
    id: string,
    data: {
      status?: "active" | "cancelled" | "expired" | "past_due";
      creditsRemaining?: number;
    }
  ): Promise<ApiSubscriptionDTO | null> {
    const updated = await this.repository.update(id, data);
    return updated ? toApiSubscriptionDTO(updated) : null;
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    expired: number;
    totalRevenue: number;
  }> {
    return this.repository.getStats();
  }
}
