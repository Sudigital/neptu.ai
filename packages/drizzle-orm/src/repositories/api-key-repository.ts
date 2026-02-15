import { eq, and, desc, count } from "drizzle-orm";

import type { Database } from "../client";

import { apiKeys, type NewApiKey, type ApiKey } from "../schemas/api-keys";

export interface ListApiKeysOptions {
  page: number;
  limit: number;
  userId?: string;
  isActive?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiKeyRepository {
  constructor(private db: Database) {}

  async create(data: NewApiKey): Promise<ApiKey> {
    const now = new Date();
    await this.db.insert(apiKeys).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create API key");
    }
    return result;
  }

  async findById(id: string): Promise<ApiKey | null> {
    const result = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const result = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);
    return result[0] ?? null;
  }

  async findByPrefix(prefix: string): Promise<ApiKey | null> {
    const result = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyPrefix, prefix))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserId(userId: string): Promise<ApiKey[]> {
    return this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async findActiveByUserId(userId: string): Promise<ApiKey[]> {
    return this.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.isActive, true)))
      .orderBy(desc(apiKeys.createdAt));
  }

  async update(
    id: string,
    data: Partial<Omit<NewApiKey, "id">>
  ): Promise<ApiKey | null> {
    await this.db
      .update(apiKeys)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiKeys.id, id));
    return this.findById(id);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db
      .update(apiKeys)
      .set({ lastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deactivate(id: string): Promise<ApiKey | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
    return true;
  }

  // Admin methods
  async list(options: ListApiKeysOptions): Promise<PaginatedResult<ApiKey>> {
    const { page, limit, userId, isActive } = options;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];
    if (userId) {
      conditions.push(eq(apiKeys.userId, userId));
    }
    if (isActive !== undefined) {
      conditions.push(eq(apiKeys.isActive, isActive));
    }

    let query = this.db.select().from(apiKeys).$dynamic();
    let countQuery = this.db
      .select({ count: count() })
      .from(apiKeys)
      .$dynamic();

    if (conditions.length > 0) {
      const whereCondition =
        conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    const [data, totalResult] = await Promise.all([
      query.orderBy(desc(apiKeys.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
