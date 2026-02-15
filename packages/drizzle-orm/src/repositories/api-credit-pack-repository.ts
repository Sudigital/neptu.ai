import { eq, asc } from "drizzle-orm";

import type { Database } from "../client";

import {
  apiCreditPacks,
  type NewApiCreditPack,
  type ApiCreditPack,
} from "../schemas/api-credit-packs";

export class ApiCreditPackRepository {
  constructor(private db: Database) {}

  async create(data: NewApiCreditPack): Promise<ApiCreditPack> {
    const now = new Date();
    await this.db.insert(apiCreditPacks).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create API credit pack");
    }
    return result;
  }

  async findById(id: string): Promise<ApiCreditPack | null> {
    const result = await this.db
      .select()
      .from(apiCreditPacks)
      .where(eq(apiCreditPacks.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findBySlug(slug: string): Promise<ApiCreditPack | null> {
    const result = await this.db
      .select()
      .from(apiCreditPacks)
      .where(eq(apiCreditPacks.slug, slug))
      .limit(1);
    return result[0] ?? null;
  }

  async findAll(): Promise<ApiCreditPack[]> {
    return this.db
      .select()
      .from(apiCreditPacks)
      .orderBy(asc(apiCreditPacks.sortOrder));
  }

  async findActive(): Promise<ApiCreditPack[]> {
    return this.db
      .select()
      .from(apiCreditPacks)
      .where(eq(apiCreditPacks.isActive, true))
      .orderBy(asc(apiCreditPacks.sortOrder));
  }

  async update(
    id: string,
    data: Partial<Omit<NewApiCreditPack, "id">>
  ): Promise<ApiCreditPack | null> {
    await this.db
      .update(apiCreditPacks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiCreditPacks.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(apiCreditPacks).where(eq(apiCreditPacks.id, id));
    return true;
  }
}
