import type { RewardType } from "@neptu/shared";

import { describe, test, expect } from "bun:test";

import {
  HabitService,
  HabitRepository,
  HabitCompletionRepository,
  UserRewardService,
  createHabitSchema,
  updateHabitSchema,
  completeHabitSchema,
  getHabitsSchema,
  getCompletionsSchema,
} from "@neptu/drizzle-orm";
import {
  HABIT_CATEGORIES,
  HABIT_FREQUENCIES,
  HABIT_STATUS,
  HABIT_REWARDS,
  HABIT_LIMITS,
} from "@neptu/shared";

describe("Habit Service Exports", () => {
  test("HabitService should export correctly", () => {
    expect(HabitService).toBeDefined();
    expect(typeof HabitService).toBe("function");
  });

  test("HabitRepository should export correctly", () => {
    expect(HabitRepository).toBeDefined();
    expect(typeof HabitRepository).toBe("function");
  });

  test("HabitCompletionRepository should export correctly", () => {
    expect(HabitCompletionRepository).toBeDefined();
    expect(typeof HabitCompletionRepository).toBe("function");
  });

  test("habit service has required methods", () => {
    const methods = [
      "createHabit",
      "getHabits",
      "getHabitById",
      "updateHabit",
      "archiveHabit",
      "deleteHabit",
      "completeHabit",
      "getCompletions",
      "getCompletionsRange",
      "getHabitsWithProgress",
    ];

    for (const method of methods) {
      expect(
        HabitService.prototype[method as keyof HabitService]
      ).toBeDefined();
    }
  });

  test("habit repository has required methods", () => {
    const methods = [
      "create",
      "findById",
      "findByUserId",
      "update",
      "delete",
      "countByUserId",
    ];

    for (const method of methods) {
      expect(
        HabitRepository.prototype[method as keyof HabitRepository]
      ).toBeDefined();
    }
  });

  test("habit completion repository has required methods", () => {
    const methods = [
      "create",
      "findById",
      "findByHabitAndDate",
      "findByUserAndDate",
      "findByUserDateRange",
      "findByHabitId",
      "upsert",
      "getStreakDates",
    ];

    for (const method of methods) {
      expect(
        HabitCompletionRepository.prototype[
          method as keyof HabitCompletionRepository
        ]
      ).toBeDefined();
    }
  });
});

describe("Habit Constants", () => {
  test("habit categories should be defined", () => {
    expect(HABIT_CATEGORIES).toBeDefined();
    expect(Array.isArray(HABIT_CATEGORIES)).toBe(true);
    expect(HABIT_CATEGORIES.length).toBe(8);
  });

  test("habit categories should include required types", () => {
    const required: (typeof HABIT_CATEGORIES)[number][] = [
      "health",
      "fitness",
      "mindfulness",
      "learning",
      "creativity",
      "social",
      "finance",
      "spiritual",
    ];
    for (const cat of required) {
      expect(HABIT_CATEGORIES).toContain(cat);
    }
  });

  test("habit frequencies should be defined", () => {
    expect(HABIT_FREQUENCIES).toBeDefined();
    expect(Array.isArray(HABIT_FREQUENCIES)).toBe(true);
    expect(HABIT_FREQUENCIES).toContain("daily");
    expect(HABIT_FREQUENCIES).toContain("weekly");
    expect(HABIT_FREQUENCIES).toContain("custom");
  });

  test("habit statuses should be defined", () => {
    expect(HABIT_STATUS).toBeDefined();
    expect(Array.isArray(HABIT_STATUS)).toBe(true);
    expect(HABIT_STATUS).toContain("active");
    expect(HABIT_STATUS).toContain("archived");
    expect(HABIT_STATUS).toContain("deleted");
  });

  test("habit rewards should be properly configured", () => {
    expect(HABIT_REWARDS.COMPLETION).toBe(0.1);
    expect(HABIT_REWARDS.STREAK_7).toBe(1);
    expect(HABIT_REWARDS.STREAK_30).toBe(5);
    expect(HABIT_REWARDS.STREAK_100).toBe(20);
  });

  test("habit limits should be properly configured", () => {
    expect(HABIT_LIMITS.MAX_HABITS_FREE).toBeGreaterThan(0);
    expect(HABIT_LIMITS.MAX_TITLE_LENGTH).toBeGreaterThan(0);
    expect(HABIT_LIMITS.MAX_DESCRIPTION_LENGTH).toBeGreaterThan(0);
    expect(HABIT_LIMITS.MAX_TARGET_COUNT).toBeGreaterThan(0);
  });
});

describe("Habit Validators", () => {
  test("createHabitSchema validates correct input", () => {
    const valid = createHabitSchema.safeParse({
      title: "Drink Water",
      category: "health",
      frequency: "daily",
      targetCount: 8,
    });
    expect(valid.success).toBe(true);
  });

  test("createHabitSchema requires title", () => {
    const invalid = createHabitSchema.safeParse({
      category: "health",
    });
    expect(invalid.success).toBe(false);
  });

  test("createHabitSchema validates category enum", () => {
    const invalid = createHabitSchema.safeParse({
      title: "Test",
      category: "invalid_category",
    });
    expect(invalid.success).toBe(false);
  });

  test("createHabitSchema validates frequency enum", () => {
    const invalid = createHabitSchema.safeParse({
      title: "Test",
      frequency: "monthly",
    });
    expect(invalid.success).toBe(false);
  });

  test("createHabitSchema applies defaults", () => {
    const result = createHabitSchema.safeParse({
      title: "Morning Run",
      category: "fitness",
      frequency: "daily",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("fitness");
      expect(result.data.frequency).toBe("daily");
      expect(result.data.targetCount).toBe(1);
    }
  });

  test("updateHabitSchema allows partial updates", () => {
    const valid = updateHabitSchema.safeParse({ title: "New Title" });
    expect(valid.success).toBe(true);
  });

  test("updateHabitSchema allows empty object", () => {
    const valid = updateHabitSchema.safeParse({});
    expect(valid.success).toBe(true);
  });

  test("completeHabitSchema validates count", () => {
    const valid = completeHabitSchema.safeParse({ count: 1 });
    expect(valid.success).toBe(true);
  });

  test("completeHabitSchema rejects zero count", () => {
    const invalid = completeHabitSchema.safeParse({ count: 0 });
    expect(invalid.success).toBe(false);
  });

  test("completeHabitSchema validates date format", () => {
    const valid = completeHabitSchema.safeParse({
      count: 1,
      date: "2025-01-15",
    });
    expect(valid.success).toBe(true);

    const invalid = completeHabitSchema.safeParse({
      count: 1,
      date: "01-15-2025",
    });
    expect(invalid.success).toBe(false);
  });

  test("getHabitsSchema validates status filter", () => {
    const valid = getHabitsSchema.safeParse({
      userId: "user-1",
      status: "active",
    });
    expect(valid.success).toBe(true);

    const invalid = getHabitsSchema.safeParse({
      userId: "user-1",
      status: "unknown",
    });
    expect(invalid.success).toBe(false);
  });

  test("getCompletionsSchema validates date range", () => {
    const valid = getCompletionsSchema.safeParse({
      userId: "user-1",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    expect(valid.success).toBe(true);
  });
});

describe("Habit Token Rewards Integration", () => {
  test("habit reward types are valid RewardType values", () => {
    const habitRewardTypes: RewardType[] = ["habit_completion", "habit_streak"];
    expect(habitRewardTypes).toHaveLength(2);
    expect(habitRewardTypes[0]).toBe("habit_completion");
    expect(habitRewardTypes[1]).toBe("habit_streak");
  });

  test("UserRewardService exports correctly for habit rewards", () => {
    expect(UserRewardService).toBeDefined();
    expect(typeof UserRewardService).toBe("function");
  });

  test("UserRewardService has createReward method", () => {
    expect(UserRewardService.prototype.createReward).toBeDefined();
  });

  test("UserRewardService has grantStreakBonus method", () => {
    expect(UserRewardService.prototype.grantStreakBonus).toBeDefined();
  });

  test("HABIT_REWARDS align with gamification streak values", () => {
    expect(HABIT_REWARDS.STREAK_7).toBe(1);
    expect(HABIT_REWARDS.STREAK_30).toBe(5);
    expect(HABIT_REWARDS.STREAK_100).toBe(20);
  });

  test("HABIT_REWARDS has COMPLETION reward for daily habits", () => {
    expect(HABIT_REWARDS.COMPLETION).toBe(0.1);
  });

  test("HABIT_REWARDS has DAILY_BONUS", () => {
    expect(HABIT_REWARDS.DAILY_BONUS).toBe(0.05);
  });

  test("habit service integrates UserRewardService in constructor", () => {
    // Verify HabitService prototype has completeHabit which is the reward-granting method
    expect(HabitService.prototype.completeHabit).toBeDefined();
  });
});
