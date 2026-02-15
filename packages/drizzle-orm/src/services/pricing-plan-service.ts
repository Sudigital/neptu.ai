import type { Database } from "../client";

import { toPricingPlanDTO, type PricingPlanDTO } from "../dto/pricing-plan-dto";
import { PricingPlanRepository } from "../repositories/pricing-plan-repository";
import {
  createPricingPlanSchema,
  updatePricingPlanSchema,
  type CreatePricingPlanInput,
  type UpdatePricingPlanInput,
} from "../validators/pricing-plan-validator";

export class PricingPlanService {
  private repository: PricingPlanRepository;

  constructor(db: Database) {
    this.repository = new PricingPlanRepository(db);
  }

  async createPlan(input: CreatePricingPlanInput): Promise<PricingPlanDTO> {
    const validated = createPricingPlanSchema.parse(input);
    const id = crypto.randomUUID();

    const plan = await this.repository.create({
      id,
      name: validated.name,
      slug: validated.slug,
      description: validated.description ?? null,
      priceUsd: validated.priceUsd.toString(),
      priceSol: validated.priceSol?.toString() ?? null,
      priceNeptu: validated.priceNeptu?.toString() ?? null,
      features: validated.features,
      limits: validated.limits,
      isActive: validated.isActive ?? true,
      isPopular: validated.isPopular ?? false,
      sortOrder: validated.sortOrder ?? 0,
    });

    return toPricingPlanDTO(plan);
  }

  async getPlanById(id: string): Promise<PricingPlanDTO | null> {
    const plan = await this.repository.findById(id);
    return plan ? toPricingPlanDTO(plan) : null;
  }

  async getPlanBySlug(slug: string): Promise<PricingPlanDTO | null> {
    const plan = await this.repository.findBySlug(slug);
    return plan ? toPricingPlanDTO(plan) : null;
  }

  async getAllPlans(): Promise<PricingPlanDTO[]> {
    const plans = await this.repository.findAll();
    return plans.map(toPricingPlanDTO);
  }

  async getActivePlans(): Promise<PricingPlanDTO[]> {
    const plans = await this.repository.findActive();
    return plans.map(toPricingPlanDTO);
  }

  async updatePlan(
    id: string,
    input: UpdatePricingPlanInput
  ): Promise<PricingPlanDTO | null> {
    const validated = updatePricingPlanSchema.parse(input);
    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.priceUsd !== undefined)
      updateData.priceUsd = validated.priceUsd;
    if (validated.priceSol !== undefined)
      updateData.priceSol = validated.priceSol;
    if (validated.priceNeptu !== undefined)
      updateData.priceNeptu = validated.priceNeptu;
    if (validated.features !== undefined)
      updateData.features = validated.features;
    if (validated.limits !== undefined) updateData.limits = validated.limits;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;
    if (validated.isPopular !== undefined)
      updateData.isPopular = validated.isPopular;
    if (validated.sortOrder !== undefined)
      updateData.sortOrder = validated.sortOrder;

    const plan = await this.repository.update(id, updateData);
    return plan ? toPricingPlanDTO(plan) : null;
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  // Seed default plans
  async seedDefaultPlans(): Promise<void> {
    const existing = await this.repository.findAll();
    if (existing.length > 0) return;

    const defaultPlans: CreatePricingPlanInput[] = [
      {
        name: "Free",
        slug: "free",
        description: "Get started with basic Balinese astrology insights",
        priceUsd: 0,
        features: [
          "1 daily reading per day",
          "Basic birth chart analysis",
          "5 Oracle chat questions per month",
          "Community access",
        ],
        limits: {
          dailyReadings: 1,
          oracleChats: 5,
          customReadings: 0,
          advancedInsights: false,
          prioritySupport: false,
        },
        isActive: true,
        isPopular: false,
        sortOrder: 0,
      },
      {
        name: "Basic",
        slug: "basic",
        description: "For enthusiasts seeking deeper cosmic guidance",
        priceUsd: 9.99,
        features: [
          "3 daily readings per day",
          "Full birth chart analysis",
          "50 Oracle chat questions per month",
          "Custom date readings",
          "Priority community support",
        ],
        limits: {
          dailyReadings: 3,
          oracleChats: 50,
          customReadings: 10,
          advancedInsights: false,
          prioritySupport: false,
        },
        isActive: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "Premium",
        slug: "premium",
        description: "Unlimited access to all Neptu features",
        priceUsd: 24.99,
        features: [
          "Unlimited daily readings",
          "Full birth chart with advanced insights",
          "Unlimited Oracle chat",
          "Unlimited custom date readings",
          "Priority support",
          "Early access to new features",
          "Exclusive community channels",
        ],
        limits: {
          dailyReadings: -1,
          oracleChats: -1,
          customReadings: -1,
          advancedInsights: true,
          prioritySupport: true,
        },
        isActive: true,
        isPopular: false,
        sortOrder: 2,
      },
    ];

    for (const plan of defaultPlans) {
      await this.createPlan(plan);
    }
  }
}
