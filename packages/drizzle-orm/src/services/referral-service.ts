import type { Database } from "../client";

import {
  toReferralDTO,
  toReferralDTOList,
  type ReferralDTO,
} from "../dto/referral-dto";
import { ReferralRepository } from "../repositories/referral-repository";
import {
  createReferralSchema,
  type CreateReferralInput,
} from "../validators/referral-validator";
import { UserRewardService } from "./user-reward-service";

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingRewardsCount: number;
  totalEarned: number;
}

export class ReferralService {
  private repository: ReferralRepository;
  private rewardService: UserRewardService;

  constructor(db: Database) {
    this.repository = new ReferralRepository(db);
    this.rewardService = new UserRewardService(db);
  }

  async createReferral(input: CreateReferralInput): Promise<ReferralDTO> {
    const validated = createReferralSchema.parse(input);

    // Check if referee already has a referral
    const existingReferral = await this.repository.findByRefereeId(
      validated.refereeId
    );
    if (existingReferral) {
      throw new Error("User has already been referred");
    }

    // Prevent self-referral
    if (validated.referrerId === validated.refereeId) {
      throw new Error("Cannot refer yourself");
    }

    const referral = await this.repository.create({
      referrerId: validated.referrerId,
      refereeId: validated.refereeId,
    });

    return toReferralDTO(referral);
  }

  async processReferralRewards(
    referralId: string,
    referrerTxSignature: string,
    refereeTxSignature: string
  ): Promise<{
    referrerReward: boolean;
    refereeReward: boolean;
  }> {
    const referral = await this.repository.findById(referralId);
    if (!referral) {
      throw new Error("Referral not found");
    }

    const now = new Date().toISOString();
    let referrerReward = false;
    let refereeReward = false;

    // Grant referrer reward if not already paid
    if (referral.referrerRewardPaid === "pending") {
      await this.rewardService.grantReferralReward(referral.referrerId, true);
      await this.repository.markReferrerPaid(
        referralId,
        referrerTxSignature,
        now
      );
      referrerReward = true;
    }

    // Grant referee reward if not already paid
    if (referral.refereeRewardPaid === "pending") {
      await this.rewardService.grantReferralReward(referral.refereeId, false);
      await this.repository.markRefereePaid(
        referralId,
        refereeTxSignature,
        now
      );
      refereeReward = true;
    }

    return { referrerReward, refereeReward };
  }

  async getReferralByReferee(refereeId: string): Promise<ReferralDTO | null> {
    const referral = await this.repository.findByRefereeId(refereeId);
    return referral ? toReferralDTO(referral) : null;
  }

  async getUserReferrals(userId: string): Promise<ReferralDTO[]> {
    const referrals = await this.repository.findByUser({ userId });
    return toReferralDTOList(referrals);
  }

  async getReferralStats(userId: string): Promise<ReferralStats> {
    const referrals = await this.repository.findByUser({ userId });

    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter(
      (r) => r.referrerRewardPaid === "paid"
    ).length;
    const pendingRewardsCount = referrals.filter(
      (r) => r.referrerId === userId && r.referrerRewardPaid === "pending"
    ).length;
    const totalEarned = referrals
      .filter((r) => r.referrerId === userId && r.referrerRewardPaid === "paid")
      .reduce((sum, r) => sum + Number(r.referrerRewardAmount ?? 0), 0);

    return {
      totalReferrals,
      successfulReferrals,
      pendingRewardsCount,
      totalEarned,
    };
  }

  async getReferralCount(userId: string): Promise<number> {
    return this.repository.getReferralCount(userId);
  }

  async getPendingReferrerRewards(userId: string): Promise<ReferralDTO[]> {
    const referrals = await this.repository.getPendingReferrerRewards(userId);
    return toReferralDTOList(referrals);
  }

  generateReferralCode(userId: string): string {
    // Create a deterministic but obfuscated referral code
    const base = userId.slice(-8).toUpperCase();
    return `NEPTU-${base}`;
  }

  async validateReferralCode(
    code: string,
    referrerId: string
  ): Promise<boolean> {
    const expectedCode = this.generateReferralCode(referrerId);
    return code === expectedCode;
  }
}
