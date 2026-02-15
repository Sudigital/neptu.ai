import { describe, test, expect, beforeAll, afterAll } from "bun:test";

import { GAMIFICATION_REWARDS, STREAK_MILESTONES } from "@neptu/shared";
import { sql } from "drizzle-orm";

import { UserStreakService, UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";

const TEST_PREFIX = `s${Date.now()}`;

describe("UserStreakService", () => {
  let streakService: UserStreakService;
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  let testUserId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    db = createTestDatabase();
    streakService = new UserStreakService(db);
    userService = new UserService(db);

    const user = await userService.createUser({
      walletAddress: `${TEST_PREFIX}MainStreakUsr123456789012`,
    });
    testUserId = user.id;
    createdUserIds.push(user.id);
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      try {
        await db.execute(sql`DELETE FROM user_rewards WHERE user_id = ${id}`);
        await db.execute(sql`DELETE FROM user_streaks WHERE user_id = ${id}`);
        await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    await closeTestDatabase();
  });

  test("should return null for user without streak", async () => {
    const newUser = await userService.createUser({
      walletAddress: `${TEST_PREFIX}NoStreakUsr1234567890123`,
    });
    createdUserIds.push(newUser.id);
    const streak = await streakService.getStreak(newUser.id);

    expect(streak).toBeNull();
  });

  test("should create streak on first check-in", async () => {
    const checkInUser = await userService.createUser({
      walletAddress: `${TEST_PREFIX}CheckInUsr12345678901234`,
    });
    createdUserIds.push(checkInUser.id);

    const result = await streakService.recordCheckIn({
      userId: checkInUser.id,
    });

    expect(result.streak).toBeDefined();
    expect(result.streak.currentStreak).toBe(1);
    expect(result.streak.totalCheckIns).toBe(1);
    expect(result.dailyRewardGranted).toBe(true);
  });

  test("should not grant reward for duplicate check-in same day", async () => {
    const dupUser = await userService.createUser({
      walletAddress: `${TEST_PREFIX}DupCheckInUsr12345678901`,
    });
    createdUserIds.push(dupUser.id);

    await streakService.recordCheckIn({ userId: dupUser.id });
    const result = await streakService.recordCheckIn({ userId: dupUser.id });

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      GAMIFICATION_REWARDS.STREAK_7_DAYS
    );
    expect(streakService.getMilestoneReward(STREAK_MILESTONES.MONTH)).toBe(
      GAMIFICATION_REWARDS.STREAK_30_DAYS
    );
    expect(streakService.getMilestoneReward(STREAK_MILESTONES.CENTURY)).toBe(
      GAMIFICATION_REWARDS.STREAK_100_DAYS
    );
    expect(streakService.getMilestoneReward(15)).toBe(0);
  });

  test("should reset streak", async () => {
    const resetUser = await userService.createUser({
      walletAddress: `${TEST_PREFIX}ResetStreakUser123456789012`,
    });
    createdUserIds.push(resetUser.id);

    await streakService.recordCheckIn({ userId: resetUser.id });

    const resetStreak = await streakService.resetStreak(resetUser.id);

    expect(resetStreak).toBeDefined();
    expect(resetStreak?.currentStreak).toBe(0);
  });
});
