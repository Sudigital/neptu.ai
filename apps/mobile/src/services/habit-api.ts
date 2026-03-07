import type {
  Habit,
  HabitCategory,
  HabitCompletion,
  HabitFrequency,
  HabitWithProgress,
} from "../types";

import { fetchApi } from "./voice-api";

// === API Response Types ===

interface CompletionResult {
  success: boolean;
  completion: HabitCompletion;
  isNewlyCompleted: boolean;
  streakRewardEarned: number;
  completionReward: number;
}

// === Habit API Functions ===

export interface CreateHabitInput {
  title: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetCount?: number;
  scheduledTime?: string | null;
  daysOfWeek?: number[];
  tokenReward?: number;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  category?: HabitCategory;
  frequency?: HabitFrequency;
  targetCount?: number;
  scheduledTime?: string | null;
  daysOfWeek?: number[];
  tokenReward?: number;
  sortOrder?: number;
}

export async function fetchHabits(
  status?: "active" | "archived"
): Promise<Habit[]> {
  const query = status ? `?status=${status}` : "";
  const res = await fetchApi<{ success: boolean; habits: Habit[] }>(
    `/api/v1/habits${query}`
  );
  return res.habits;
}

export async function fetchHabitsWithProgress(): Promise<HabitWithProgress[]> {
  const res = await fetchApi<{
    success: boolean;
    date: string;
    habits: HabitWithProgress[];
  }>("/api/v1/habits/today");
  return res.habits;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const res = await fetchApi<{ success: boolean; habit: Habit }>(
    "/api/v1/habits",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return res.habit;
}

export async function updateHabitApi(
  habitId: string,
  input: UpdateHabitInput
): Promise<Habit> {
  const res = await fetchApi<{ success: boolean; habit: Habit }>(
    `/api/v1/habits/${habitId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );
  return res.habit;
}

export async function archiveHabitApi(habitId: string): Promise<Habit> {
  const res = await fetchApi<{ success: boolean; habit: Habit }>(
    `/api/v1/habits/${habitId}/archive`,
    { method: "POST" }
  );
  return res.habit;
}

export async function deleteHabitApi(habitId: string): Promise<void> {
  await fetchApi<{ success: boolean }>(`/api/v1/habits/${habitId}`, {
    method: "DELETE",
  });
}

export async function completeHabitApi(
  habitId: string,
  count: number = 1,
  date?: string
): Promise<CompletionResult> {
  const body: Record<string, unknown> = { count };
  if (date) body.date = date;

  return fetchApi<CompletionResult>(`/api/v1/habits/${habitId}/complete`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchCompletionsRange(
  from: string,
  to: string
): Promise<HabitCompletion[]> {
  const res = await fetchApi<{
    success: boolean;
    completions: HabitCompletion[];
  }>(`/api/v1/habits/completions/range?from=${from}&to=${to}`);
  return res.completions;
}

export interface HabitRewardsSummary {
  totalEarned: number;
  totalPending: number;
  totalClaimed: number;
  recentRewards: Array<{
    id: string;
    rewardType: string;
    neptuAmount: number;
    status: string;
    description: string;
    createdAt: string;
  }>;
}

export async function fetchHabitRewards(): Promise<HabitRewardsSummary> {
  const res = await fetchApi<{
    success: boolean;
    rewards: HabitRewardsSummary;
  }>("/api/v1/habits/rewards");
  return res.rewards;
}

export interface HabitAISuggestion {
  title: string;
  description: string;
  category: string;
  frequency: string;
  targetCount: number;
  scheduledTime: string | null;
}

export async function suggestHabitAI(
  birthDate: string,
  input?: string,
  language?: string
): Promise<HabitAISuggestion> {
  const res = await fetchApi<{
    success: boolean;
    suggestion: HabitAISuggestion;
  }>("/api/v1/habits/ai-suggest", {
    method: "POST",
    body: JSON.stringify({
      input: input || undefined,
      birthDate,
      language: language || "en",
    }),
  });
  return res.suggestion;
}
