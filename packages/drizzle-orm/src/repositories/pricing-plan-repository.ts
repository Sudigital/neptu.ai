import { eq, asc } from "drizzle-orm";

import type { Database } from "../client";

import {
  pricingPlans,
  type NewPricingPlan,
  type PricingPlan,
} from "../schemas/pricing-plans";

export class PricingPlanRepository {
  constructor(private db: Database) {}

  async create(data: NewPricingPlan): Promise<PricingPlan> {
    await this.db.insert(pricingPlans).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create pricing plan");
    }
    return result;
  }

  async findById(id: string): Promise<PricingPlan | null> {
    const result = await this.db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findBySlug(slug: string): Promise<PricingPlan | null> {
    const result = await this.db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.slug, slug))
      .limit(1);
    return result[0] ?? null;
  }

  async findAll(): Promise<PricingPlan[]> {
    return this.db
      .select()
      .from(pricingPlans)
      .orderBy(asc(pricingPlans.sortOrder));
  }

  async findActive(): Promise<PricingPlan[]> {
    return this.db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.isActive, true))
      .orderBy(asc(pricingPlans.sortOrder));
  }

  async update(
    id: string,
    data: Partial<Omit<NewPricingPlan, "id">>
  ): Promise<PricingPlan | null> {
    await this.db
      .update(pricingPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pricingPlans.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(pricingPlans).where(eq(pricingPlans.id, id));
    return true;
  }
}
