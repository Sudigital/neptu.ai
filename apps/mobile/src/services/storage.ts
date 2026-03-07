import { MMKV } from "react-native-mmkv";

import type {
  UserProfile,
  ConversationEntry,
  Habit,
  HabitCompletion,
  ThemeMode,
} from "../types";

import { MAX_CONVERSATION_HISTORY } from "../constants";

const mmkv = new MMKV({ id: "neptu-storage" });

const KEYS = {
  USER_PROFILE: "user_profile",
  LANGUAGE: "language_code",
  ONBOARDED: "onboarded",
  CONVERSATIONS_TODAY: "conversations_today",
  CONVERSATIONS_DATE: "conversations_date",
  MWA_AUTH_TOKEN: "mwa_auth_token",
  CONVERSATION_HISTORY: "conversation_history",
  AUTO_PLAY_AUDIO: "auto_play_audio",
  THEME_MODE: "theme_mode",
  HABITS: "habits",
  HABIT_COMPLETIONS: "habit_completions",
  AI_SUGGESTS_TODAY: "ai_suggests_today",
  AI_SUGGESTS_DATE: "ai_suggests_date",
} as const;

export function saveProfile(profile: UserProfile): void {
  mmkv.set(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function getProfile(): UserProfile | null {
  const raw = mmkv.getString(KEYS.USER_PROFILE);
  if (!raw) return null;
  return JSON.parse(raw) as UserProfile;
}

export function getLanguage(): string {
  return mmkv.getString(KEYS.LANGUAGE) ?? "en";
}

export function saveLanguage(code: string): void {
  mmkv.set(KEYS.LANGUAGE, code);
}

export function isOnboarded(): boolean {
  return mmkv.getBoolean(KEYS.ONBOARDED) ?? false;
}

export function setOnboarded(value: boolean): void {
  mmkv.set(KEYS.ONBOARDED, value);
}

export function clearAll(): void {
  mmkv.clearAll();
}

// Conversation tracking for free tier
function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getConversationsToday(): number {
  const storedDate = mmkv.getString(KEYS.CONVERSATIONS_DATE);
  const today = getTodayKey();
  if (storedDate !== today) {
    mmkv.set(KEYS.CONVERSATIONS_DATE, today);
    mmkv.set(KEYS.CONVERSATIONS_TODAY, 0);
    return 0;
  }
  return mmkv.getNumber(KEYS.CONVERSATIONS_TODAY) ?? 0;
}

export function incrementConversations(): number {
  const today = getTodayKey();
  const storedDate = mmkv.getString(KEYS.CONVERSATIONS_DATE);
  if (storedDate !== today) {
    mmkv.set(KEYS.CONVERSATIONS_DATE, today);
    mmkv.set(KEYS.CONVERSATIONS_TODAY, 1);
    return 1;
  }
  const count = (mmkv.getNumber(KEYS.CONVERSATIONS_TODAY) ?? 0) + 1;
  mmkv.set(KEYS.CONVERSATIONS_TODAY, count);
  return count;
}

// MWA auth token persistence
export function saveMwaAuthToken(token: string): void {
  mmkv.set(KEYS.MWA_AUTH_TOKEN, token);
}

export function getMwaAuthToken(): string {
  return mmkv.getString(KEYS.MWA_AUTH_TOKEN) ?? "";
}

// Conversation history
export function getConversationHistory(): ConversationEntry[] {
  const raw = mmkv.getString(KEYS.CONVERSATION_HISTORY);
  if (!raw) return [];
  return JSON.parse(raw) as ConversationEntry[];
}

export function addConversation(entry: ConversationEntry): ConversationEntry[] {
  const history = getConversationHistory();
  const updated = [entry, ...history].slice(0, MAX_CONVERSATION_HISTORY);
  mmkv.set(KEYS.CONVERSATION_HISTORY, JSON.stringify(updated));
  return updated;
}

// Auto-play audio setting
export function getAutoPlayAudio(): boolean {
  return mmkv.getBoolean(KEYS.AUTO_PLAY_AUDIO) ?? true;
}

export function saveAutoPlayAudio(enabled: boolean): void {
  mmkv.set(KEYS.AUTO_PLAY_AUDIO, enabled);
}

export function clearConversationHistory(): void {
  mmkv.set(KEYS.CONVERSATION_HISTORY, "[]");
}

// Theme preference
export function getThemeMode(): ThemeMode {
  return (mmkv.getString(KEYS.THEME_MODE) as ThemeMode) ?? "dark";
}

export function saveThemeMode(mode: ThemeMode): void {
  mmkv.set(KEYS.THEME_MODE, mode);
}

// Habits CRUD
export function getHabits(): Habit[] {
  const raw = mmkv.getString(KEYS.HABITS);
  if (!raw) return [];
  return JSON.parse(raw) as Habit[];
}

export function saveHabits(habits: Habit[]): void {
  mmkv.set(KEYS.HABITS, JSON.stringify(habits));
}

export function addHabit(habit: Habit): Habit[] {
  const habits = getHabits();
  const updated = [...habits, habit];
  saveHabits(updated);
  return updated;
}

export function updateHabit(habitId: string, updates: Partial<Habit>): Habit[] {
  const habits = getHabits();
  const updated = habits.map((h) =>
    h.id === habitId ? { ...h, ...updates } : h
  );
  saveHabits(updated);
  return updated;
}

export function deleteHabit(habitId: string): Habit[] {
  const habits = getHabits().filter((h) => h.id !== habitId);
  saveHabits(habits);
  return habits;
}

// Habit completions
function getCompletionKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getHabitCompletions(date?: string): HabitCompletion[] {
  const raw = mmkv.getString(KEYS.HABIT_COMPLETIONS);
  if (!raw) return [];
  const all = JSON.parse(raw) as HabitCompletion[];
  const targetDate = date ?? getCompletionKey();
  return all.filter((c) => c.date === targetDate);
}

export function getAllHabitCompletions(): HabitCompletion[] {
  const raw = mmkv.getString(KEYS.HABIT_COMPLETIONS);
  if (!raw) return [];
  return JSON.parse(raw) as HabitCompletion[];
}

export function completeHabit(
  habitId: string,
  count: number = 1
): HabitCompletion[] {
  const raw = mmkv.getString(KEYS.HABIT_COMPLETIONS);
  const all: HabitCompletion[] = raw ? JSON.parse(raw) : [];
  const date = getCompletionKey();
  const existing = all.findIndex(
    (c) => c.habitId === habitId && c.date === date
  );

  if (existing >= 0) {
    all[existing].count += count;
    all[existing].completedAt = new Date().toISOString();
  } else {
    all.push({ habitId, date, count, completedAt: new Date().toISOString() });
  }

  mmkv.set(KEYS.HABIT_COMPLETIONS, JSON.stringify(all));
  return all.filter((c) => c.date === date);
}

export function getHabitStreak(habitId: string): number {
  const raw = mmkv.getString(KEYS.HABIT_COMPLETIONS);
  if (!raw) return 0;
  const all = JSON.parse(raw) as HabitCompletion[];
  const dates = [
    ...new Set(all.filter((c) => c.habitId === habitId).map((c) => c.date)),
  ]
    .sort()
    .reverse();

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedKey = expected.toISOString().split("T")[0];
    if (dates[i] === expectedKey) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// AI suggest daily tracking
export function getAiSuggestsToday(): number {
  const storedDate = mmkv.getString(KEYS.AI_SUGGESTS_DATE);
  const today = getTodayKey();
  if (storedDate !== today) {
    mmkv.set(KEYS.AI_SUGGESTS_DATE, today);
    mmkv.set(KEYS.AI_SUGGESTS_TODAY, 0);
    return 0;
  }
  return mmkv.getNumber(KEYS.AI_SUGGESTS_TODAY) ?? 0;
}

export function incrementAiSuggests(): number {
  const today = getTodayKey();
  const storedDate = mmkv.getString(KEYS.AI_SUGGESTS_DATE);
  if (storedDate !== today) {
    mmkv.set(KEYS.AI_SUGGESTS_DATE, today);
    mmkv.set(KEYS.AI_SUGGESTS_TODAY, 1);
    return 1;
  }
  const count = (mmkv.getNumber(KEYS.AI_SUGGESTS_TODAY) ?? 0) + 1;
  mmkv.set(KEYS.AI_SUGGESTS_TODAY, count);
  return count;
}
