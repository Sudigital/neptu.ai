import { GAMIFICATION_REWARDS, STREAK_MILESTONES } from "@neptu/shared";

import type { Database } from "../client";

import { toUserStreakDTO, type UserStreakDTO } from "../dto/user-streak-dto";
import { UserStreakRepository } from "../repositories/user-streak-repository";
import {
  checkInSchema,
  type CheckInInput,
} from "../validators/user-streak-validator";
import { UserRewardService } from "./user-reward-service";

const STREAK_MILESTONE_VALUES = [
  STREAK_MILESTONES.WEEK,
  STREAK_MILESTONES.MONTH,
  STREAK_MILESTONES.CENTURY,
] as const;

export interface CheckInResult {
  streak: UserStreakDTO;
  dailyRewardGranted: boolean;
  streakBonusGranted: boolean;
  streakBonusAmount: number;
}

export class UserStreakService {
  private repository: UserStreakRepository;
  private rewardService: UserRewardService;

  constructor(db: Database) {
    this.repository = new UserStreakRepository(db);
    this.rewardService = new UserRewardService(db);
  }

  async getStreak(userId: string): Promise<UserStreakDTO | null> {
    const streak = await this.repository.findByUserId(userId);
    return streak ? toUserStreakDTO(streak) : null;
  }

  async recordCheckIn(input: CheckInInput): Promise<CheckInResult> {
    const validated = checkInSchema.parse(input);
    const today = new Date().toISOString().split("T")[0];

    let existingStreak = await this.repository.findByUserId(validated.userId);

    if (!existingStreak) {
      existingStreak = await this.repository.create({
        userId: validated.userId,
      });
    }

    // Check if already checked in today
    const lastCheckInDate = existingStreak.lastCheckIn
      ? existingStreak.lastCheckIn.split("T")[0]
      : null;

    if (lastCheckInDate === today) {
      return {
        streak: toUserStreakDTO(existingStreak),
        dailyRewardGranted: false,
        streakBonusGranted: false,
        streakBonusAmount: 0,
      };
    }

    // Calculate new streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newCurrentStreak = 1;
    if (lastCheckInDate === yesterdayStr) {
      // Continuing streak
      newCurrentStreak = existingStreak.currentStreak + 1;
    }

    const newLongestStreak = Math.max(
      existingStreak.longestStreak,
      newCurrentStreak
    );
    const newTotalCheckIns = existingStreak.totalCheckIns + 1;
    const nowIso = new Date().toISOString();

    // Update streak
    const updatedStreak = await this.repository.updateStreak(
      validated.userId,
      newCurrentStreak,
      newLongestStreak,
      nowIso,
      newTotalCheckIns
    );

    if (!updatedStreak) {
      throw new Error("Failed to update streak");
    }

    // Grant daily check-in reward
    await this.rewardService.grantDailyCheckInReward(validated.userId);

    // Check for streak milestone bonuses
    let streakBonusGranted = false;
    let streakBonusAmount = 0;

    if (
      STREAK_MILESTONE_VALUES.includes(
        newCurrentStreak as (typeof STREAK_MILESTONE_VALUES)[number]
      )
    ) {
      const bonusReward = await this.rewardService.grantStreakBonus(
        validated.userId,
        newCurrentStreak
      );
      if (bonusReward) {
        streakBonusGranted = true;
        streakBonusAmount = Number(bonusReward.neptuAmount);
      }
    }

    return {
      streak: toUserStreakDTO(updatedStreak),
      dailyRewardGranted: true,
      streakBonusGranted,
      streakBonusAmount,
    };
  }

  async resetStreak(userId: string): Promise<UserStreakDTO | null> {
    const streak = await this.repository.findByUserId(userId);
    if (!streak) {
      return null;
    }

    const resetStreak = await this.repository.resetStreak(userId);
    return resetStreak ? toUserStreakDTO(resetStreak) : null;
  }

  isStreakActive(streak: UserStreakDTO): boolean {
    if (!streak.lastCheckIn) {
      return false;
    }

    const lastCheckInDate = new Date(streak.lastCheckIn);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const lastCheckInDay = lastCheckInDate.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    return lastCheckInDay === todayStr || lastCheckInDay === yesterdayStr;
  }

  getNextMilestone(currentStreak: number): number | null {
    for (const milestone of STREAK_MILESTONE_VALUES) {
      if (milestone > currentStreak) {
        return milestone;
      }
    }
    return null;
  }

  getMilestoneReward(milestone: number): number {
    switch (milestone) {
      case STREAK_MILESTONES.WEEK:
        return GAMIFICATION_REWARDS.STREAK_7_DAYS;
      case STREAK_MILESTONES.MONTH:
        return GAMIFICATION_REWARDS.STREAK_30_DAYS;
      case STREAK_MILESTONES.CENTURY:
        return GAMIFICATION_REWARDS.STREAK_100_DAYS;
      default:
        return 0;
    }
  }
}
