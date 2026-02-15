import { eq, and, desc, count, sql } from "drizzle-orm";

import type { Database } from "../client";

import {
  apiSubscriptions,
  type NewApiSubscription,
  type ApiSubscription,
} from "../schemas/api-subscriptions";

export interface ListSubscriptionsOptions {
  page: number;
  limit: number;
  status?: "active" | "cancelled" | "expired" | "past_due";
  planId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiSubscriptionRepository {
  constructor(private db: Database) {}

  async create(data: NewApiSubscription): Promise<ApiSubscription> {
    const now = new Date();
    await this.db.insert(apiSubscriptions).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create API subscription");
    }
    return result;
  }

  async findById(id: string): Promise<ApiSubscription | null> {
    const result = await this.db
      .select()
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserId(userId: string): Promise<ApiSubscription[]> {
    return this.db
      .select()
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.userId, userId))
      .orderBy(desc(apiSubscriptions.createdAt));
  }

  async findActiveByUserId(userId: string): Promise<ApiSubscription | null> {
    const result = await this.db
      .select()
      .from(apiSubscriptions)
      .where(
        and(
          eq(apiSubscriptions.userId, userId),
          eq(apiSubscriptions.status, "active")
        )
      )
      .orderBy(desc(apiSubscriptions.createdAt))
      .limit(1);
    return result[0] ?? null;
  }

  async findByPlanId(planId: string): Promise<ApiSubscription[]> {
    return this.db
      .select()
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.planId, planId))
      .orderBy(desc(apiSubscriptions.createdAt));
  }

  async update(
    id: string,
    data: Partial<Omit<NewApiSubscription, "id">>
  ): Promise<ApiSubscription | null> {
    await this.db
      .update(apiSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiSubscriptions.id, id));
    return this.findById(id);
  }

  async updateCredits(
    id: string,
    creditsRemaining: number,
    aiCreditsRemaining: number
  ): Promise<ApiSubscription | null> {
    return this.update(id, { creditsRemaining, aiCreditsRemaining });
  }

  async decrementCredits(
    id: string,
    basicCredits: number,
    aiCredits: number
  ): Promise<ApiSubscription | null> {
    const sub = await this.findById(id);
    if (!sub) return null;

    const newBasicCredits = Math.max(0, sub.creditsRemaining - basicCredits);
    const newAiCredits = Math.max(0, sub.aiCreditsRemaining - aiCredits);

    return this.updateCredits(id, newBasicCredits, newAiCredits);
  }

  async cancel(id: string): Promise<ApiSubscription | null> {
    return this.update(id, { status: "cancelled", cancelledAt: new Date() });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(apiSubscriptions).where(eq(apiSubscriptions.id, id));
    return true;
  }

  async list(
    options: ListSubscriptionsOptions
  ): Promise<PaginatedResult<ApiSubscription>> {
    const { page, limit, status, planId } = options;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];
    if (status) {
      conditions.push(eq(apiSubscriptions.status, status));
    }
    if (planId) {
      conditions.push(eq(apiSubscriptions.planId, planId));
    }

    let query = this.db.select().from(apiSubscriptions).$dynamic();
    let countQuery = this.db
      .select({ count: count() })
      .from(apiSubscriptions)
      .$dynamic();

    if (conditions.length > 0) {
      const whereCondition =
        conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    const [data, totalResult] = await Promise.all([
      query
        .orderBy(desc(apiSubscriptions.createdAt))
        .limit(limit)
        .offset(offset),
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

  async getStats(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    expired: number;
    totalRevenue: number;
  }> {
    const result = await this.db
      .select({
        total: count(),
        active: sql<number>`COUNT(*) FILTER (WHERE ${apiSubscriptions.status} = 'active')`,
        cancelled: sql<number>`COUNT(*) FILTER (WHERE ${apiSubscriptions.status} = 'cancelled')`,
        expired: sql<number>`COUNT(*) FILTER (WHERE ${apiSubscriptions.status} = 'expired')`,
      })
      .from(apiSubscriptions);

    return {
      total: result[0]?.total ?? 0,
      active: Number(result[0]?.active ?? 0),
      cancelled: Number(result[0]?.cancelled ?? 0),
      expired: Number(result[0]?.expired ?? 0),
      totalRevenue: 0, // Would need payment data to calculate
    };
  }
}
