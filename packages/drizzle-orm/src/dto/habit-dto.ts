import type { HabitCategory, HabitFrequency, HabitStatus } from "@neptu/shared";

import type { HabitCompletion } from "../schemas/habit-completions";
import type { Habit } from "../schemas/habits";

export interface HabitDTO {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetCount: number;
  scheduledTime: string | null;
  daysOfWeek: number[];
  tokenReward: string;
  status: HabitStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletionDTO {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  count: number;
  createdAt: string;
}

export interface HabitWithProgressDTO extends HabitDTO {
  todayCount: number;
  isCompletedToday: boolean;
  currentStreak: number;
}

export function toHabitDTO(habit: Habit): HabitDTO {
  return {
    id: habit.id,
    userId: habit.userId,
    title: habit.title,
    description: habit.description ?? "",
    category: habit.category,
    frequency: habit.frequency,
    targetCount: habit.targetCount,
    scheduledTime: habit.scheduledTime,
    daysOfWeek: (habit.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6]) as number[],
    tokenReward: habit.tokenReward,
    status: habit.status,
    sortOrder: habit.sortOrder,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
  };
}

export function toHabitDTOList(habits: Habit[]): HabitDTO[] {
  return habits.map(toHabitDTO);
}

export function toHabitCompletionDTO(
  completion: HabitCompletion
): HabitCompletionDTO {
  return {
    id: completion.id,
    habitId: completion.habitId,
    userId: completion.userId,
    date: completion.date,
    count: completion.count,
    createdAt: completion.createdAt.toISOString(),
  };
}

export function toHabitCompletionDTOList(
  completions: HabitCompletion[]
): HabitCompletionDTO[] {
  return completions.map(toHabitCompletionDTO);
}
