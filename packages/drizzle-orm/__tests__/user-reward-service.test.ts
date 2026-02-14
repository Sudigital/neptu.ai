import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { sql } from "drizzle-orm";
import { UserRewardService, UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";
import { GAMIFICATION_REWARDS } from "@neptu/shared";

describe("UserRewardService", () => {
  let rewardService: UserRewardService;
  let userService: UserService;
  let testUserId: string;

  beforeAll(async () => {
    const db = createTestDatabase();

    // Create tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT UNIQUE NOT NULL,
        email TEXT,
        display_name TEXT,
        birth_date TEXT,
        interests TEXT,
        onboarded INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_rewards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        reward_type TEXT NOT NULL,
        neptu_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        claim_tx_signature TEXT,
        claimed_at TEXT,
        expires_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    rewardService = new UserRewardService(db);
    userService = new UserService(db);

    // Create test user
    const user = await userService.createUser({
      walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrReward",
    });
    testUserId = user.id;
  });

  afterAll(() => {
    closeTestDatabase();
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

    // Should have rewards from previous tests
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((r) => r.status === "pending")).toBe(true);
  });

  test("should calculate total pending amount", async () => {
    const totalAmount = await rewardService.getTotalPendingAmount(testUserId);

    // Should have accumulated rewards from previous tests
    expect(totalAmount).toBeGreaterThan(0);
  });
});
