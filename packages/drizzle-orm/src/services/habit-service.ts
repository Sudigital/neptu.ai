import { HABIT_LIMITS, HABIT_REWARDS } from "@neptu/shared";

import type { Database } from "../client";

import {
  toHabitDTO,
  toHabitDTOList,
  toHabitCompletionDTO,
  toHabitCompletionDTOList,
  type HabitDTO,
  type HabitCompletionDTO,
  type HabitWithProgressDTO,
} from "../dto/habit-dto";
import { HabitCompletionRepository } from "../repositories/habit-completion-repository";
import { HabitRepository } from "../repositories/habit-repository";
import {
  createHabitSchema,
  updateHabitSchema,
  completeHabitSchema,
  type CreateHabitInput,
  type UpdateHabitInput,
  type CompleteHabitInput,
} from "../validators/habit-validator";
import { UserRewardService } from "./user-reward-service";

export interface HabitCompletionResult {
  completion: HabitCompletionDTO;
  isNewlyCompleted: boolean;
  streakRewardEarned: number;
  completionReward: number;
}

export class HabitService {
  private habitRepo: HabitRepository;
  private completionRepo: HabitCompletionRepository;
  private rewardService: UserRewardService;

  constructor(db: Database) {
    this.habitRepo = new HabitRepository(db);
    this.completionRepo = new HabitCompletionRepository(db);
    this.rewardService = new UserRewardService(db);
  }

  async createHabit(
    userId: string,
    input: CreateHabitInput
  ): Promise<HabitDTO> {
    const validated = createHabitSchema.parse(input);

    // Check limit
    const count = await this.habitRepo.countByUserId(userId);
    if (count >= HABIT_LIMITS.MAX_HABITS_FREE) {
      throw new Error(
        `Maximum ${HABIT_LIMITS.MAX_HABITS_FREE} active habits allowed`
      );
    }

    const id = crypto.randomUUID();
    const habit = await this.habitRepo.create({
      id,
      userId,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      frequency: validated.frequency,
      targetCount: validated.targetCount,
      scheduledTime: validated.scheduledTime ?? null,
      daysOfWeek: validated.daysOfWeek,
      tokenReward: String(validated.tokenReward),
      sortOrder: count,
    });

    return toHabitDTO(habit);
  }

  async getHabits(
    userId: string,
    status?: "active" | "archived" | "deleted"
  ): Promise<HabitDTO[]> {
    const habits = await this.habitRepo.findByUserId(
      userId,
      status ?? "active"
    );
    return toHabitDTOList(habits);
  }

  async getHabitById(habitId: string): Promise<HabitDTO | null> {
    const habit = await this.habitRepo.findById(habitId);
    return habit ? toHabitDTO(habit) : null;
  }

  async updateHabit(
    habitId: string,
    userId: string,
    input: UpdateHabitInput
  ): Promise<HabitDTO | null> {
    const validated = updateHabitSchema.parse(input);

    // Verify ownership
    const existing = await this.habitRepo.findById(habitId);
    if (!existing || existing.userId !== userId) return null;

    const updateData: Record<string, unknown> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.category !== undefined)
      updateData.category = validated.category;
    if (validated.frequency !== undefined)
      updateData.frequency = validated.frequency;
    if (validated.targetCount !== undefined)
      updateData.targetCount = validated.targetCount;
    if (validated.scheduledTime !== undefined)
      updateData.scheduledTime = validated.scheduledTime;
    if (validated.daysOfWeek !== undefined)
      updateData.daysOfWeek = validated.daysOfWeek;
    if (validated.tokenReward !== undefined)
      updateData.tokenReward = String(validated.tokenReward);
    if (validated.sortOrder !== undefined)
      updateData.sortOrder = validated.sortOrder;

    const habit = await this.habitRepo.update(habitId, updateData);
    return habit ? toHabitDTO(habit) : null;
  }

  async archiveHabit(habitId: string, userId: string): Promise<boolean> {
    const existing = await this.habitRepo.findById(habitId);
    if (!existing || existing.userId !== userId) return false;
    await this.habitRepo.update(habitId, { status: "archived" });
    return true;
  }

  async deleteHabit(habitId: string, userId: string): Promise<boolean> {
    const existing = await this.habitRepo.findById(habitId);
    if (!existing || existing.userId !== userId) return false;
    return this.habitRepo.delete(habitId);
  }

  async completeHabit(
    habitId: string,
    userId: string,
    input: CompleteHabitInput = { count: 1 }
  ): Promise<HabitCompletionResult> {
    const validated = completeHabitSchema.parse(input);
    const date = validated.date ?? new Date().toISOString().split("T")[0];

    // Verify ownership
    const habit = await this.habitRepo.findById(habitId);
    if (!habit || habit.userId !== userId) {
      throw new Error("Habit not found");
    }

    // Check if already completed today
    const existingCompletion = await this.completionRepo.findByHabitAndDate(
      habitId,
      date
    );
    const wasAlreadyComplete = existingCompletion
      ? existingCompletion.count >= habit.targetCount
      : false;

    // Upsert completion
    const completion = await this.completionRepo.upsert(
      habitId,
      userId,
      date,
      validated.count
    );
    const isNewlyCompleted =
      !wasAlreadyComplete && completion.count >= habit.targetCount;

    // Calculate streak
    let streakRewardEarned = 0;
    if (isNewlyCompleted) {
      const streak = await this.calculateStreak(habitId);
      if (streak === 7) streakRewardEarned = HABIT_REWARDS.STREAK_7;
      else if (streak === 30) streakRewardEarned = HABIT_REWARDS.STREAK_30;
      else if (streak === 100) streakRewardEarned = HABIT_REWARDS.STREAK_100;

      // Persist completion reward
      const completionAmount = Number(habit.tokenReward);
      if (completionAmount > 0) {
        await this.rewardService.createReward({
          userId,
          rewardType: "habit_completion",
          neptuAmount: completionAmount,
          description: `Completed: ${habit.title}`,
        });
      }

      // Persist streak reward
      if (streakRewardEarned > 0) {
        await this.rewardService.createReward({
          userId,
          rewardType: "habit_streak",
          neptuAmount: streakRewardEarned,
          description: `${streak}-day streak: ${habit.title}`,
        });
      }
    }

    return {
      completion: toHabitCompletionDTO(completion),
      isNewlyCompleted,
      streakRewardEarned,
      completionReward: isNewlyCompleted ? Number(habit.tokenReward) : 0,
    };
  }

  async getCompletions(
    userId: string,
    date: string
  ): Promise<HabitCompletionDTO[]> {
    const completions = await this.completionRepo.findByUserAndDate(
      userId,
      date
    );
    return toHabitCompletionDTOList(completions);
  }

  async getCompletionsRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitCompletionDTO[]> {
    const completions = await this.completionRepo.findByUserDateRange(
      userId,
      startDate,
      endDate
    );
    return toHabitCompletionDTOList(completions);
  }

  async getHabitsWithProgress(
    userId: string,
    date?: string
  ): Promise<HabitWithProgressDTO[]> {
    const targetDate = date ?? new Date().toISOString().split("T")[0];
    const habits = await this.habitRepo.findByUserId(userId, "active");
    const completions = await this.completionRepo.findByUserAndDate(
      userId,
      targetDate
    );

    const results: HabitWithProgressDTO[] = [];
    for (const habit of habits) {
      const completion = completions.find((c) => c.habitId === habit.id);
      const todayCount = completion?.count ?? 0;
      const currentStreak = await this.calculateStreak(habit.id);

      results.push({
        ...toHabitDTO(habit),
        todayCount,
        isCompletedToday: todayCount >= habit.targetCount,
        currentStreak,
      });
    }
    return results;
  }

  private async calculateStreak(habitId: string): Promise<number> {
    const dates = await this.completionRepo.getStreakDates(habitId);
    if (dates.length === 0) return 0;

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
}
