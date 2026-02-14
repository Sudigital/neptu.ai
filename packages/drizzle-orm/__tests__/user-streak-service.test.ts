import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { sql } from "drizzle-orm";
import { UserStreakService, UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";
import { GAMIFICATION_REWARDS, STREAK_MILESTONES } from "@neptu/shared";

describe("UserStreakService", () => {
  let streakService: UserStreakService;
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
      CREATE TABLE IF NOT EXISTS user_streaks (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_check_in TEXT,
        total_check_ins INTEGER NOT NULL DEFAULT 0,
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

    streakService = new UserStreakService(db);
    userService = new UserService(db);

    // Create test user
    const user = await userService.createUser({
      walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrStreak",
    });
    testUserId = user.id;
  });

  afterAll(() => {
    closeTestDatabase();
  });

  test("should return null for user without streak", async () => {
    const newUser = await userService.createUser({
      walletAddress: "7KQNqLgVr5xMfWdF9vTp6t6rNoStrkWXy",
    });
    const streak = await streakService.getStreak(newUser.id);

    expect(streak).toBeNull();
  });

  test("should create streak on first check-in", async () => {
    const result = await streakService.recordCheckIn({ userId: testUserId });

    expect(result.streak).toBeDefined();
    expect(result.streak.currentStreak).toBe(1);
    expect(result.streak.totalCheckIns).toBe(1);
    expect(result.dailyRewardGranted).toBe(true);
  });

  test("should not grant reward for duplicate check-in same day", async () => {
    const result = await streakService.recordCheckIn({ userId: testUserId });

    expect(result.dailyRewardGranted).toBe(false);
    expect(result.streak.totalCheckIns).toBe(1);
  });

  test("should identify active streak correctly", () => {
    const todayStreak = {
      id: "test",
      userId: testUserId,
      currentStreak: 5,
      longestStreak: 5,
      lastCheckIn: new Date().toISOString(),
      totalCheckIns: 5,
      createdAt: "",
      updatedAt: "",
    };

    expect(streakService.isStreakActive(todayStreak)).toBe(true);
  });

  test("should identify inactive streak correctly", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 3);

    const oldStreak = {
      id: "test",
      userId: testUserId,
      currentStreak: 5,
      longestStreak: 5,
      lastCheckIn: oldDate.toISOString(),
      totalCheckIns: 5,
      createdAt: "",
      updatedAt: "",
    };

    expect(streakService.isStreakActive(oldStreak)).toBe(false);
  });

  test("should get next milestone correctly", () => {
    expect(streakService.getNextMilestone(1)).toBe(STREAK_MILESTONES.WEEK);
    expect(streakService.getNextMilestone(7)).toBe(STREAK_MILESTONES.MONTH);
    expect(streakService.getNextMilestone(30)).toBe(STREAK_MILESTONES.CENTURY);
    expect(streakService.getNextMilestone(100)).toBeNull();
  });

  test("should get milestone rewards correctly", () => {
    expect(streakService.getMilestoneReward(STREAK_MILESTONES.WEEK)).toBe(
      GAMIFICATION_REWARDS.STREAK_7_DAYS,
    );
    expect(streakService.getMilestoneReward(STREAK_MILESTONES.MONTH)).toBe(
      GAMIFICATION_REWARDS.STREAK_30_DAYS,
    );
    expect(streakService.getMilestoneReward(STREAK_MILESTONES.CENTURY)).toBe(
      GAMIFICATION_REWARDS.STREAK_100_DAYS,
    );
    expect(streakService.getMilestoneReward(15)).toBe(0);
  });

  test("should reset streak", async () => {
    const resetStreak = await streakService.resetStreak(testUserId);

    expect(resetStreak).toBeDefined();
    expect(resetStreak?.currentStreak).toBe(0);
  });
});
