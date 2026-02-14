import { eq, desc, and, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  referrals,
  type NewReferral,
  type Referral,
} from "../schemas/referrals";

export interface FindReferralsOptions {
  userId: string;
  asReferrer?: boolean;
  limit?: number;
  offset?: number;
}

export class ReferralRepository {
  constructor(private db: Database) {}

  async create(data: Omit<NewReferral, "id">): Promise<Referral> {
    const id = crypto.randomUUID();
    const result = await this.db
      .insert(referrals)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  async findById(id: string): Promise<Referral | null> {
    const result = await this.db
      .select()
      .from(referrals)
      .where(eq(referrals.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByRefereeId(refereeId: string): Promise<Referral | null> {
    const result = await this.db
      .select()
      .from(referrals)
      .where(eq(referrals.refereeId, refereeId))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUser(options: FindReferralsOptions): Promise<Referral[]> {
    const { userId, asReferrer = true, limit = 50, offset = 0 } = options;

    const condition = asReferrer
      ? eq(referrals.referrerId, userId)
      : eq(referrals.refereeId, userId);

    return this.db
      .select()
      .from(referrals)
      .where(condition)
      .orderBy(desc(referrals.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async markReferrerPaid(
    id: string,
    txSignature: string,
    completedAt: string,
  ): Promise<Referral | null> {
    const result = await this.db
      .update(referrals)
      .set({
        referrerRewardPaid: "paid",
        referrerRewardTxSignature: txSignature,
        completedAt,
      })
      .where(eq(referrals.id, id))
      .returning();
    return result[0] ?? null;
  }

  async markRefereePaid(
    id: string,
    txSignature: string,
    completedAt: string,
  ): Promise<Referral | null> {
    const result = await this.db
      .update(referrals)
      .set({
        refereeRewardPaid: "paid",
        refereeRewardTxSignature: txSignature,
        completedAt,
      })
      .where(eq(referrals.id, id))
      .returning();
    return result[0] ?? null;
  }

  async getReferralCount(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
    return result[0]?.count ?? 0;
  }

  async getPendingReferrerRewards(userId: string): Promise<Referral[]> {
    return this.db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, userId),
          eq(referrals.referrerRewardPaid, "pending"),
        ),
      );
  }
}
