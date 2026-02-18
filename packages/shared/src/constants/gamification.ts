// ============================================================================
// User Profile Constants
// ============================================================================

export const USER_INTERESTS = [
  "love",
  "career",
  "health",
  "finance",
  "family",
  "friendship",
  "intimacy",
  "spirituality",
  "mindfulness",
  "selfgrowth",
  "purpose",
  "balance",
  "creativity",
  "travel",
  "fitness",
  "education",
  "luck",
  "crypto",
] as const;

export type UserInterest = (typeof USER_INTERESTS)[number];

// ============================================================================
// Gamification Constants
// ============================================================================

export const GAMIFICATION_REWARDS = {
  DAILY_CHECK_IN: 0.1,
  STREAK_7_DAYS: 1,
  STREAK_30_DAYS: 5,
  STREAK_100_DAYS: 20,
  FIRST_READING: 5,
  REFERRAL_REWARD: 10,
  REFEREE_BONUS: 2,
  SOCIAL_SHARE: 0.5,
  AUSPICIOUS_MULTIPLIER: 2,
} as const;

export const STREAK_MILESTONES = {
  WEEK: 7,
  MONTH: 30,
  CENTURY: 100,
} as const;

export type RewardType =
  | "daily_check_in"
  | "streak_bonus"
  | "first_reading"
  | "referral"
  | "referee_bonus"
  | "social_share"
  | "auspicious_day"
  | "payment_reward";

export type RewardStatus = "pending" | "claimed" | "expired";
