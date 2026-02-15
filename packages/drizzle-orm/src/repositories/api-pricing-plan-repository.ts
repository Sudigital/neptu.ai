import { eq, asc } from "drizzle-orm";

import type { Database } from "../client";

import {
  apiPricingPlans,
  type NewApiPricingPlan,
  type ApiPricingPlan,
} from "../schemas/api-pricing-plans";

export class ApiPricingPlanRepository {
  constructor(private db: Database) {}

  async create(data: NewApiPricingPlan): Promise<ApiPricingPlan> {
    const now = new Date();
    await this.db.insert(apiPricingPlans).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create API pricing plan");
    }
    return result;
  }

  async findById(id: string): Promise<ApiPricingPlan | null> {
    const result = await this.db
      .select()
      .from(apiPricingPlans)
      .where(eq(apiPricingPlans.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findBySlug(slug: string): Promise<ApiPricingPlan | null> {
    const result = await this.db
      .select()
      .from(apiPricingPlans)
      .where(eq(apiPricingPlans.slug, slug))
      .limit(1);
    return result[0] ?? null;
  }

  async findByTier(tier: string): Promise<ApiPricingPlan[]> {
    return this.db
      .select()
      .from(apiPricingPlans)
      .where(eq(apiPricingPlans.tier, tier))
      .orderBy(asc(apiPricingPlans.sortOrder));
  }

  async findAll(): Promise<ApiPricingPlan[]> {
    return this.db
      .select()
      .from(apiPricingPlans)
      .orderBy(asc(apiPricingPlans.sortOrder));
  }

  async findActive(): Promise<ApiPricingPlan[]> {
    return this.db
      .select()
      .from(apiPricingPlans)
      .where(eq(apiPricingPlans.isActive, true))
      .orderBy(asc(apiPricingPlans.sortOrder));
  }

  async update(
    id: string,
    data: Partial<Omit<NewApiPricingPlan, "id">>
  ): Promise<ApiPricingPlan | null> {
    await this.db
      .update(apiPricingPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiPricingPlans.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(apiPricingPlans).where(eq(apiPricingPlans.id, id));
    return true;
  }
}
