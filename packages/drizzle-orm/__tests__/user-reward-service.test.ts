import { describe, test, expect, beforeAll, afterAll } from "bun:test";

import { GAMIFICATION_REWARDS } from "@neptu/shared";
import { sql } from "drizzle-orm";

import { UserRewardService, UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";

const TEST_PREFIX = `w${Date.now()}`;

describe("UserRewardService", () => {
  let rewardService: UserRewardService;
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  let testUserId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    db = createTestDatabase();
    rewardService = new UserRewardService(db);
    userService = new UserService(db);

    const user = await userService.createUser({
      walletAddress: `${TEST_PREFIX}RewardUsr12345678901234567`,
    });
    testUserId = user.id;
    createdUserIds.push(user.id);
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      try {
        await db.execute(sql`DELETE FROM user_rewards WHERE user_id = ${id}`);
        await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    await closeTestDatabase();
  });

  test("should create daily check-in reward", async () => {
    const reward = await rewardService.grantDailyCheckInReward(testUserId);

    expect(reward).toBeDefined();
    expect(reward.rewardType).toBe("daily_check_in");
    expect(reward.neptuAmount).toBe(GAMIFICATION_REWARDS.DAILY_CHECK_IN);
    expect(reward.status).toBe("pending");
  });

  test("should create first reading reward", async () => {
    const reward = await rewardService.grantFirstReadingBonus(testUserId);

    expect(reward).toBeDefined();
    expect(reward.rewardType).toBe("first_reading");
    expect(reward.neptuAmount).toBe(GAMIFICATION_REWARDS.FIRST_READING);
  });

  test("should create referral reward for referrer", async () => {
    const reward = await rewardService.grantReferralReward(testUserId, true);

    expect(reward).toBeDefined();
    expect(reward.rewardType).toBe("referral");
    expect(reward.neptuAmount).toBe(GAMIFICATION_REWARDS.REFERRAL_REWARD);
  });

  test("should create referee bonus", async () => {
    const reward = await rewardService.grantReferralReward(testUserId, false);

    expect(reward).toBeDefined();
    expect(reward.rewardType).toBe("referee_bonus");
    expect(reward.neptuAmount).toBe(GAMIFICATION_REWARDS.REFEREE_BONUS);
  });

  test("should grant streak bonus for 7 days", async () => {
    const reward = await rewardService.grantStreakBonus(testUserId, 7);

    expect(reward).toBeDefined();
    expect(reward?.rewardType).toBe("streak_bonus");
    expect(reward?.neptuAmount).toBe(GAMIFICATION_REWARDS.STREAK_7_DAYS);
  });

  test("should grant streak bonus for 30 days", async () => {
    const reward = await rewardService.grantStreakBonus(testUserId, 30);

    expect(reward).toBeDefined();
    expect(reward?.rewardType).toBe("streak_bonus");
    expect(reward?.neptuAmount).toBe(GAMIFICATION_REWARDS.STREAK_30_DAYS);
  });

  test("should not grant streak bonus for non-milestone days", async () => {
    const reward = await rewardService.grantStreakBonus(testUserId, 5);

    expect(reward).toBeNull();
  });

  test("should get pending rewards", async () => {
    const pending = await rewardService.getPendingRewards(testUserId);

    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((r) => r.status === "pending")).toBe(true);
  });

  test("should calculate total pending amount", async () => {
    const totalAmount = await rewardService.getTotalPendingAmount(testUserId);

    expect(totalAmount).toBeGreaterThan(0);
  });
});
