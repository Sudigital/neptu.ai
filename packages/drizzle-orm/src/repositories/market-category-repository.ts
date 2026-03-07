import { eq, asc } from "drizzle-orm";

import type { Database } from "../client";

import {
  marketCategories,
  type NewMarketCategory,
  type MarketCategoryRow,
} from "../schemas/market-categories";

export class MarketCategoryRepository {
  constructor(private db: Database) {}

  async create(data: NewMarketCategory): Promise<MarketCategoryRow> {
    await this.db.insert(marketCategories).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create market category");
    }
    return result;
  }

  async findById(id: string): Promise<MarketCategoryRow | null> {
    const result = await this.db
      .select()
      .from(marketCategories)
      .where(eq(marketCategories.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findBySlug(slug: string): Promise<MarketCategoryRow | null> {
    const result = await this.db
      .select()
      .from(marketCategories)
      .where(eq(marketCategories.slug, slug))
      .limit(1);
    return result[0] ?? null;
  }

  async findAll(): Promise<MarketCategoryRow[]> {
    return this.db
      .select()
      .from(marketCategories)
      .orderBy(asc(marketCategories.sortOrder));
  }

  async findActive(): Promise<MarketCategoryRow[]> {
    return this.db
      .select()
      .from(marketCategories)
      .where(eq(marketCategories.isActive, true))
      .orderBy(asc(marketCategories.sortOrder));
  }

  async update(
    id: string,
    data: Partial<Omit<NewMarketCategory, "id">>
  ): Promise<MarketCategoryRow | null> {
    await this.db
      .update(marketCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketCategories.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(marketCategories).where(eq(marketCategories.id, id));
    return true;
  }
}
