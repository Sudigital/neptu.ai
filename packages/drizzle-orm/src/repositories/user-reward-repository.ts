import type { RewardType, RewardStatus } from "@neptu/shared";

import { eq, desc, and, sql } from "drizzle-orm";

import type { Database } from "../client";

import {
  userRewards,
  type NewUserReward,
  type UserReward,
} from "../schemas/user-rewards";

export interface FindUserRewardsOptions {
  userId: string;
  status?: RewardStatus;
  rewardType?: RewardType;
  limit?: number;
  offset?: number;
}

export class UserRewardRepository {
  constructor(private db: Database) {}

  async create(data: Omit<NewUserReward, "id">): Promise<UserReward> {
    const id = crypto.randomUUID();
    const result = await this.db
      .insert(userRewards)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  async findById(id: string): Promise<UserReward | null> {
    const result = await this.db
      .select()
      .from(userRewards)
      .where(eq(userRewards.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUser(options: FindUserRewardsOptions): Promise<UserReward[]> {
    const { userId, status, rewardType, limit = 50, offset = 0 } = options;

    const conditions = [eq(userRewards.userId, userId)];
    if (status) {
      conditions.push(eq(userRewards.status, status));
    }
    if (rewardType) {
      conditions.push(eq(userRewards.rewardType, rewardType));
    }

    return this.db
      .select()
      .from(userRewards)
      .where(and(...conditions))
      .orderBy(desc(userRewards.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async claim(
    id: string,
    claimTxSignature: string,
    claimedAt: string
  ): Promise<UserReward | null> {
    const result = await this.db
      .update(userRewards)
      .set({ status: "claimed", claimTxSignature, claimedAt })
      .where(eq(userRewards.id, id))
      .returning();
    return result[0] ?? null;
  }

  async expire(id: string): Promise<UserReward | null> {
    const result = await this.db
      .update(userRewards)
      .set({ status: "expired" })
      .where(eq(userRewards.id, id))
      .returning();
    return result[0] ?? null;
  }

  async revertClaim(id: string): Promise<UserReward | null> {
    const result = await this.db
      .update(userRewards)
      .set({ status: "pending", claimTxSignature: null, claimedAt: null })
      .where(eq(userRewards.id, id))
      .returning();
    return result[0] ?? null;
  }

  async findClaimedByUser(userId: string): Promise<UserReward[]> {
    return this.db
      .select()
      .from(userRewards)
      .where(
        and(eq(userRewards.userId, userId), eq(userRewards.status, "claimed"))
      )
      .orderBy(desc(userRewards.createdAt));
  }

  async getTotalPendingAmount(userId: string): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(neptu_amount), 0)` })
      .from(userRewards)
      .where(
        and(eq(userRewards.userId, userId), eq(userRewards.status, "pending"))
      );
    return Number(result[0]?.total ?? 0);
  }

  async getPendingCount(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userRewards)
      .where(
        and(eq(userRewards.userId, userId), eq(userRewards.status, "pending"))
      );
    return result[0]?.count ?? 0;
  }
}
