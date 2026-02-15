import { GAMIFICATION_REWARDS } from "@neptu/shared";

import type { Database } from "../client";

import {
  toUserRewardDTO,
  toUserRewardDTOList,
  type UserRewardDTO,
} from "../dto/user-reward-dto";
import { UserRewardRepository } from "../repositories/user-reward-repository";
import {
  createUserRewardSchema,
  claimUserRewardSchema,
  getUserRewardsSchema,
  type CreateUserRewardInput,
  type ClaimUserRewardInput,
  type GetUserRewardsInput,
} from "../validators/user-reward-validator";

export interface RewardSummary {
  pendingCount: number;
  pendingAmount: number;
  claimedCount: number;
  claimedAmount: number;
}

export class UserRewardService {
  private repository: UserRewardRepository;

  constructor(db: Database) {
    this.repository = new UserRewardRepository(db);
  }

  async createReward(input: CreateUserRewardInput): Promise<UserRewardDTO> {
    const validated = createUserRewardSchema.parse(input);
    const reward = await this.repository.create({
      userId: validated.userId,
      rewardType: validated.rewardType,
      neptuAmount: validated.neptuAmount.toString(),
      description: validated.description,
      expiresAt: validated.expiresAt,
    });
    return toUserRewardDTO(reward);
  }

  async claimReward(
    input: ClaimUserRewardInput
  ): Promise<UserRewardDTO | null> {
    const validated = claimUserRewardSchema.parse(input);
    const reward = await this.repository.findById(validated.rewardId);
    if (!reward || reward.status !== "pending") {
      return null;
    }

    const claimedAt = new Date().toISOString();
    const claimed = await this.repository.claim(
      validated.rewardId,
      validated.claimTxSignature,
      claimedAt
    );
    return claimed ? toUserRewardDTO(claimed) : null;
  }

  async getRewardsByUser(input: GetUserRewardsInput): Promise<UserRewardDTO[]> {
    const validated = getUserRewardsSchema.parse(input);
    const rewards = await this.repository.findByUser({
      userId: validated.userId,
      status: validated.status,
      rewardType: validated.rewardType,
      limit: validated.limit,
      offset: validated.offset,
    });
    return toUserRewardDTOList(rewards);
  }

  async getPendingRewards(userId: string): Promise<UserRewardDTO[]> {
    const rewards = await this.repository.findByUser({
      userId,
      status: "pending",
    });
    return toUserRewardDTOList(rewards);
  }

  async getTotalPendingAmount(userId: string): Promise<number> {
    return this.repository.getTotalPendingAmount(userId);
  }

  async getPendingCount(userId: string): Promise<number> {
    return this.repository.getPendingCount(userId);
  }

  async revertClaim(rewardId: string): Promise<UserRewardDTO | null> {
    const reward = await this.repository.findById(rewardId);
    if (!reward || reward.status !== "claimed") {
      return null;
    }
    const reverted = await this.repository.revertClaim(rewardId);
    return reverted ? toUserRewardDTO(reverted) : null;
  }

  async getClaimedRewards(userId: string): Promise<UserRewardDTO[]> {
    const rewards = await this.repository.findClaimedByUser(userId);
    return toUserRewardDTOList(rewards);
  }

  async grantDailyCheckInReward(userId: string): Promise<UserRewardDTO> {
    return this.createReward({
      userId,
      rewardType: "daily_check_in",
      neptuAmount: GAMIFICATION_REWARDS.DAILY_CHECK_IN,
      description: "Daily check-in reward",
    });
  }

  async grantStreakBonus(
    userId: string,
    streakDays: number
  ): Promise<UserRewardDTO | null> {
    let amount = 0;
    let description = "";

    if (streakDays === 7) {
      amount = GAMIFICATION_REWARDS.STREAK_7_DAYS;
      description = "7-day streak bonus";
    } else if (streakDays === 30) {
      amount = GAMIFICATION_REWARDS.STREAK_30_DAYS;
      description = "30-day streak bonus";
    } else if (streakDays === 100) {
      amount = GAMIFICATION_REWARDS.STREAK_100_DAYS;
      description = "100-day streak bonus";
    }

    if (amount === 0) {
      return null;
    }

    return this.createReward({
      userId,
      rewardType: "streak_bonus",
      neptuAmount: amount,
      description,
    });
  }

  async grantFirstReadingBonus(userId: string): Promise<UserRewardDTO> {
    return this.createReward({
      userId,
      rewardType: "first_reading",
      neptuAmount: GAMIFICATION_REWARDS.FIRST_READING,
      description: "First reading completed bonus",
    });
  }

  async grantReferralReward(
    userId: string,
    isReferrer: boolean
  ): Promise<UserRewardDTO> {
    const amount = isReferrer
      ? GAMIFICATION_REWARDS.REFERRAL_REWARD
      : GAMIFICATION_REWARDS.REFEREE_BONUS;
    const description = isReferrer
      ? "Referral reward"
      : "Welcome bonus for being referred";

    return this.createReward({
      userId,
      rewardType: isReferrer ? "referral" : "referee_bonus",
      neptuAmount: amount,
      description,
    });
  }
}
