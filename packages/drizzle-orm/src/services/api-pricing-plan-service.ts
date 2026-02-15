import type { Database } from "../client";

import {
  toApiPricingPlanDTO,
  type ApiPricingPlanDTO,
} from "../dto/api-pricing-plan-dto";
import { ApiPricingPlanRepository } from "../repositories/api-pricing-plan-repository";
import {
  createApiPricingPlanSchema,
  updateApiPricingPlanSchema,
  type CreateApiPricingPlanInput,
  type UpdateApiPricingPlanInput,
} from "../validators/api-pricing-plan-validator";

export class ApiPricingPlanService {
  private repository: ApiPricingPlanRepository;

  constructor(db: Database) {
    this.repository = new ApiPricingPlanRepository(db);
  }

  async createPlan(
    input: CreateApiPricingPlanInput
  ): Promise<ApiPricingPlanDTO> {
    const validated = createApiPricingPlanSchema.parse(input);
    const id = crypto.randomUUID();

    const plan = await this.repository.create({
      id,
      name: validated.name,
      slug: validated.slug,
      description: validated.description ?? null,
      tier: validated.tier,
      priceUsd: validated.priceUsd.toString(),
      priceSol: validated.priceSol?.toString() ?? null,
      priceNeptu: validated.priceNeptu?.toString() ?? null,
      billingPeriod: validated.billingPeriod,
      features: validated.features,
      limits: validated.limits,
      overageRates: validated.overageRates,
      discountPercent: validated.discountPercent ?? 0,
      isActive: validated.isActive ?? true,
      isPopular: validated.isPopular ?? false,
      sortOrder: validated.sortOrder ?? 0,
    });

    return toApiPricingPlanDTO(plan);
  }

  async getPlanById(id: string): Promise<ApiPricingPlanDTO | null> {
    const plan = await this.repository.findById(id);
    return plan ? toApiPricingPlanDTO(plan) : null;
  }

  async getPlanBySlug(slug: string): Promise<ApiPricingPlanDTO | null> {
    const plan = await this.repository.findBySlug(slug);
    return plan ? toApiPricingPlanDTO(plan) : null;
  }

  async getPlansByTier(tier: string): Promise<ApiPricingPlanDTO[]> {
    const plans = await this.repository.findByTier(tier);
    return plans.map(toApiPricingPlanDTO);
  }

  async getAllPlans(): Promise<ApiPricingPlanDTO[]> {
    const plans = await this.repository.findAll();
    return plans.map(toApiPricingPlanDTO);
  }

  async getActivePlans(): Promise<ApiPricingPlanDTO[]> {
    const plans = await this.repository.findActive();
    return plans.map(toApiPricingPlanDTO);
  }

  async updatePlan(
    id: string,
    input: UpdateApiPricingPlanInput
  ): Promise<ApiPricingPlanDTO | null> {
    const validated = updateApiPricingPlanSchema.parse(input);
    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.tier !== undefined) updateData.tier = validated.tier;
    if (validated.priceUsd !== undefined)
      updateData.priceUsd = validated.priceUsd.toString();
    if (validated.priceSol !== undefined)
      updateData.priceSol = validated.priceSol?.toString();
    if (validated.priceNeptu !== undefined)
      updateData.priceNeptu = validated.priceNeptu?.toString();
    if (validated.billingPeriod !== undefined)
      updateData.billingPeriod = validated.billingPeriod;
    if (validated.features !== undefined)
      updateData.features = validated.features;
    if (validated.limits !== undefined) updateData.limits = validated.limits;
    if (validated.overageRates !== undefined)
      updateData.overageRates = validated.overageRates;
    if (validated.discountPercent !== undefined)
      updateData.discountPercent = validated.discountPercent;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;
    if (validated.isPopular !== undefined)
      updateData.isPopular = validated.isPopular;
    if (validated.sortOrder !== undefined)
      updateData.sortOrder = validated.sortOrder;

    const plan = await this.repository.update(id, updateData);
    return plan ? toApiPricingPlanDTO(plan) : null;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async seedDefaultPlans(): Promise<void> {
    const existing = await this.repository.findAll();
    if (existing.length > 0) return;

    const defaultPlans: CreateApiPricingPlanInput[] = [
      {
        name: "Starter",
        slug: "api-starter",
        description: "Perfect for small projects and testing",
        tier: "starter",
        priceUsd: 7.5,
        priceSol: 0.05,
        priceNeptu: 50,
        billingPeriod: "monthly",
        features: [
          "1,000 basic API calls/month",
          "100 AI Oracle calls/month",
          "Email support",
          "API documentation access",
        ],
        limits: { basicCalls: 1000, aiCalls: 100, rateLimit: 60 },
        overageRates: {
          basicCallNeptu: 0.1,
          basicCallSol: 0.0001,
          aiCallNeptu: 1,
          aiCallSol: 0.001,
        },
        discountPercent: 0,
        isActive: true,
        isPopular: false,
        sortOrder: 0,
      },
      {
        name: "Pro",
        slug: "api-pro",
        description: "For growing applications",
        tier: "pro",
        priceUsd: 60,
        priceSol: 0.4,
        priceNeptu: 400,
        billingPeriod: "monthly",
        features: [
          "10,000 basic API calls/month",
          "1,000 AI Oracle calls/month",
          "Priority email support",
          "Webhook integrations",
          "20% overage discount",
        ],
        limits: { basicCalls: 10000, aiCalls: 1000, rateLimit: 120 },
        overageRates: {
          basicCallNeptu: 0.08,
          basicCallSol: 0.00008,
          aiCallNeptu: 0.8,
          aiCallSol: 0.0008,
        },
        discountPercent: 20,
        isActive: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "Business",
        slug: "api-business",
        description: "For high-volume integrations",
        tier: "business",
        priceUsd: 450,
        priceSol: 3,
        priceNeptu: 3000,
        billingPeriod: "monthly",
        features: [
          "100,000 basic API calls/month",
          "10,000 AI Oracle calls/month",
          "Dedicated support",
          "Custom integrations",
          "SLA guarantee",
          "40% overage discount",
        ],
        limits: { basicCalls: 100000, aiCalls: 10000, rateLimit: 300 },
        overageRates: {
          basicCallNeptu: 0.06,
          basicCallSol: 0.00006,
          aiCallNeptu: 0.6,
          aiCallSol: 0.0006,
        },
        discountPercent: 40,
        isActive: true,
        isPopular: false,
        sortOrder: 2,
      },
      {
        name: "Enterprise",
        slug: "api-enterprise",
        description: "Custom solutions for large organizations",
        tier: "enterprise",
        priceUsd: 0,
        priceSol: 0,
        priceNeptu: 0,
        billingPeriod: "monthly",
        features: [
          "Unlimited API calls",
          "Unlimited AI Oracle calls",
          "Dedicated account manager",
          "Custom development",
          "On-premise deployment option",
          "Custom SLA",
        ],
        limits: { basicCalls: -1, aiCalls: -1, rateLimit: 1000 },
        overageRates: {
          basicCallNeptu: 0,
          basicCallSol: 0,
          aiCallNeptu: 0,
          aiCallSol: 0,
        },
        discountPercent: 0,
        isActive: true,
        isPopular: false,
        sortOrder: 3,
      },
    ];

    for (const plan of defaultPlans) {
      await this.createPlan(plan);
    }
  }
}
