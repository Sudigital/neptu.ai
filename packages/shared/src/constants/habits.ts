// ============================================================================
// Habit Constants — single source of truth
// ============================================================================

export const HABIT_CATEGORIES = [
  "health",
  "mindfulness",
  "fitness",
  "learning",
  "finance",
  "social",
  "creativity",
  "spiritual",
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export const HABIT_FREQUENCIES = ["daily", "weekly", "custom"] as const;

export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const HABIT_STATUS = ["active", "archived", "deleted"] as const;

export type HabitStatus = (typeof HABIT_STATUS)[number];

// Token rewards for habit completion
export const HABIT_REWARDS = {
  COMPLETION: 0.1,
  TOKEN_STEP: 0.25,
  TOKEN_HALF: 0.5,
  TOKEN_FULL: 1.0,
  STREAK_7: 1,
  STREAK_30: 5,
  STREAK_100: 20,
  DAILY_BONUS: 0.05,
} as const;

export const HABIT_LIMITS = {
  MAX_HABITS_FREE: 10,
  MAX_HABITS_PREMIUM: 50,
  MAX_TITLE_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_TARGET_COUNT: 100,
  MAX_DAILY_COMPLETIONS: 200,
  AI_SUGGEST_DAILY_FREE: 3,
  AI_SUGGEST_DAILY_PREMIUM: 20,
} as const;
