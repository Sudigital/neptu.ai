import type { UserStreak } from "../schemas/user-streaks";

export interface UserStreakDTO {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  totalCheckIns: number;
  createdAt: string;
  updatedAt: string;
}

export function toUserStreakDTO(streak: UserStreak): UserStreakDTO {
  return {
    id: streak.id,
    userId: streak.userId,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCheckIn: streak.lastCheckIn,
    totalCheckIns: streak.totalCheckIns,
    createdAt: streak.createdAt.toISOString(),
    updatedAt: streak.updatedAt.toISOString(),
  };
}
