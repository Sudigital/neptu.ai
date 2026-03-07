import { HABIT_REWARDS } from "@neptu/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Habit,
  HabitCategory,
  HabitCompletion,
  HabitFrequency,
  HabitWithProgress,
} from "../types";

import {
  fetchHabitsWithProgress,
  createHabit as createHabitApi,
  updateHabitApi,
  deleteHabitApi,
  completeHabitApi,
} from "../services/habit-api";
import {
  getHabits,
  saveHabits,
  addHabit as addHabitStorage,
  updateHabit as updateHabitStorage,
  deleteHabit as deleteHabitStorage,
  getHabitCompletions,
  completeHabit as completeHabitStorage,
  getHabitStreak,
} from "../services/storage";
import { getWalletAddress } from "../services/voice-api";

interface UseHabitsReturn {
  habits: HabitWithProgress[];
  addHabit: (input: NewHabitInput) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (id: string) => void;
  refreshHabits: () => void;
  isSyncing: boolean;
}

export interface NewHabitInput {
  title: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetCount: number;
  scheduledTime: string | null;
  daysOfWeek: number[];
  tokenReward: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function isOnline(): boolean {
  return !!getWalletAddress();
}

function enrichHabit(
  habit: Habit,
  completions: HabitCompletion[]
): HabitWithProgress {
  const today = todayKey();
  const todayCompletion = completions.find(
    (c) => c.habitId === habit.id && c.date === today
  );
  const todayCount = todayCompletion?.count ?? 0;
  const isCompletedToday = todayCount >= habit.targetCount;
  const currentStreak = getHabitStreak(habit.id);

  return { ...habit, todayCount, isCompletedToday, currentStreak };
}

function apiHabitToLocal(h: HabitWithProgress): Habit {
  return {
    id: h.id,
    title: h.title,
    description: h.description ?? "",
    category: h.category,
    frequency: h.frequency,
    targetCount: h.targetCount,
    scheduledTime: h.scheduledTime ?? null,
    daysOfWeek: h.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
    tokenReward: h.tokenReward ?? HABIT_REWARDS.COMPLETION,
    createdAt: h.createdAt,
    isArchived: false,
  };
}

export function useHabits(): UseHabitsReturn {
  const [rawHabits, setRawHabits] = useState<Habit[]>(getHabits);
  const [completions, setCompletions] = useState<HabitCompletion[]>(() =>
    getHabitCompletions()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const idMapRef = useRef<Map<string, string>>(new Map());

  // Background sync from API on mount
  useEffect(() => {
    if (!isOnline()) return;
    let cancelled = false;
    setIsSyncing(true);

    fetchHabitsWithProgress()
      .then((apiHabits) => {
        if (cancelled) return;
        // Update local cache with API data
        const localHabits = apiHabits.map(apiHabitToLocal);
        saveHabits(localHabits);
        setRawHabits(localHabits);

        // Build completions from API progress data
        const today = todayKey();
        const apiCompletions: HabitCompletion[] = apiHabits
          .filter((h) => h.todayCount > 0)
          .map((h) => ({
            habitId: h.id,
            date: today,
            count: h.todayCount,
            completedAt: new Date().toISOString(),
          }));
        if (apiCompletions.length > 0) {
          setCompletions(apiCompletions);
        }
      })
      .catch(() => {
        // Silently fall back to local data
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const habits = useMemo(() => {
    const active = rawHabits.filter((h) => !h.isArchived);
    return active.map((h) => enrichHabit(h, completions));
  }, [rawHabits, completions]);

  const addHabit = useCallback((input: NewHabitInput) => {
    const localId = generateId();
    const habit: Habit = {
      id: localId,
      ...input,
      createdAt: new Date().toISOString(),
      isArchived: false,
    };
    // Optimistic local update
    const updated = addHabitStorage(habit);
    setRawHabits(updated);

    // Sync to API
    if (isOnline()) {
      createHabitApi(input)
        .then((apiHabit) => {
          // Replace local ID with server ID
          idMapRef.current.set(localId, apiHabit.id);
          setRawHabits((prev) => {
            const replaced = prev.map((h) =>
              h.id === localId ? { ...h, id: apiHabit.id } : h
            );
            saveHabits(replaced);
            return replaced;
          });
        })
        .catch(() => {
          // Keep local version — will sync later
        });
    }
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    const updated = updateHabitStorage(id, updates);
    setRawHabits(updated);

    if (isOnline()) {
      updateHabitApi(id, updates).catch(() => {
        // Keep local version
      });
    }
  }, []);

  const deleteHabit = useCallback((id: string) => {
    const updated = deleteHabitStorage(id);
    setRawHabits(updated);

    if (isOnline()) {
      deleteHabitApi(id).catch(() => {
        // Keep local deletion
      });
    }
  }, []);

  const completeHabit = useCallback((id: string) => {
    const updatedCompletions = completeHabitStorage(id);
    setCompletions(updatedCompletions);

    if (isOnline()) {
      completeHabitApi(id, 1).catch(() => {
        // Keep local completion
      });
    }
  }, []);

  const refreshHabits = useCallback(() => {
    // Load from local first
    setRawHabits(getHabits());
    setCompletions(getHabitCompletions());

    // Then sync from API
    if (isOnline()) {
      setIsSyncing(true);
      fetchHabitsWithProgress()
        .then((apiHabits) => {
          const localHabits = apiHabits.map(apiHabitToLocal);
          saveHabits(localHabits);
          setRawHabits(localHabits);
        })
        .catch(() => {
          // Keep local data
        })
        .finally(() => setIsSyncing(false));
    }
  }, []);

  return {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    refreshHabits,
    isSyncing,
  };
}
