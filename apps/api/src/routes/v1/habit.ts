import { zValidator } from "@hono/zod-validator";
import {
  HabitService,
  UserService,
  UserRewardService,
  createHabitSchema,
  updateHabitSchema,
  completeHabitSchema,
  type Database,
} from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import { Hono } from "hono";
import { z } from "zod";

import {
  dynamicJwtAuth,
  type DynamicJwtAuthEnv,
} from "../../middleware/dynamic-jwt-auth";

const log = createLogger({ name: "habit" });

type Env = DynamicJwtAuthEnv & {
  Variables: DynamicJwtAuthEnv["Variables"] & {
    db: Database;
    adminWalletAddress: string | undefined;
  };
};

export const habitRoutes = new Hono<Env>();

habitRoutes.use("/*", dynamicJwtAuth);

const listQuerySchema = z.object({
  status: z.enum(["active", "archived", "deleted"]).optional(),
});

const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

async function resolveUserId(c: {
  get: (key: string) => unknown;
}): Promise<string | null> {
  const db = c.get("db") as Database;
  const walletAddress = c.get("walletAddress") as string;
  const userService = new UserService(db);
  const user = await userService.getUserByWallet(walletAddress);
  return user?.id ?? null;
}

habitRoutes.get("/", zValidator("query", listQuerySchema), async (c) => {
  try {
    const userId = await resolveUserId(c);
    if (!userId)
      return c.json({ success: false, error: "User not found" }, 404);

    const { status } = c.req.valid("query");
    const db = c.get("db");
    const habitService = new HabitService(db);
    const habits = await habitService.getHabits(userId, status);

    return c.json({ success: true, habits });
  } catch (error) {
    log.error({ err: error as Error }, "Failed to list habits");
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list habits",
      },
      500
    );
  }
});

habitRoutes.get("/today", async (c) => {
  try {
    const userId = await resolveUserId(c);
    if (!userId)
      return c.json({ success: false, error: "User not found" }, 404);

    const db = c.get("db");
    const habitService = new HabitService(db);
    const today = new Date().toISOString().split("T")[0];
    const habits = await habitService.getHabitsWithProgress(userId, today);

    return c.json({ success: true, date: today, habits });
  } catch (error) {
    log.error({ err: error as Error }, "Failed to get today habits");
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get habits",
      },
      500
    );
  }
});

habitRoutes.get(
  "/completions/range",
  zValidator("query", dateRangeSchema),
  async (c) => {
    try {
      const userId = await resolveUserId(c);
      if (!userId)
        return c.json({ success: false, error: "User not found" }, 404);

      const { from, to } = c.req.valid("query");
      const db = c.get("db");
      const habitService = new HabitService(db);
      const completions = await habitService.getCompletionsRange(
        userId,
        from,
        to
      );

      return c.json({ success: true, completions });
    } catch (error) {
      log.error({ err: error as Error }, "Failed to get completions range");
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get completions",
        },
        500
      );
    }
  }
);

habitRoutes.get("/rewards", async (c) => {
  try {
    const userId = await resolveUserId(c);
    if (!userId)
      return c.json({ success: false, error: "User not found" }, 404);

    const db = c.get("db");
    const rewardService = new UserRewardService(db);

    const [pending, claimed] = await Promise.all([
      rewardService.getPendingRewards(userId),
      rewardService.getClaimedRewards(userId),
    ]);

    const habitRewards = [
      ...pending.filter(
        (r) =>
          r.rewardType === "habit_completion" || r.rewardType === "habit_streak"
      ),
      ...claimed.filter(
        (r) =>
          r.rewardType === "habit_completion" || r.rewardType === "habit_streak"
      ),
    ];

    const totalEarned = habitRewards.reduce(
      (sum, r) => sum + Number(r.neptuAmount),
      0
    );
    const totalPending = habitRewards
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + Number(r.neptuAmount), 0);
    const totalClaimed = habitRewards
      .filter((r) => r.status === "claimed")
      .reduce((sum, r) => sum + Number(r.neptuAmount), 0);

    return c.json({
      success: true,
      rewards: {
        totalEarned,
        totalPending,
        totalClaimed,
        recentRewards: habitRewards.slice(0, 20),
      },
    });
  } catch (error) {
    log.error({ err: error as Error }, "Failed to get habit rewards");
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get rewards",
      },
      500
    );
  }
});

const aiSuggestSchema = z.object({
  input: z.string().max(200).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  language: z.string().max(5).optional(),
});

habitRoutes.post(
  "/ai-suggest",
  zValidator("json", aiSuggestSchema),
  async (c) => {
    try {
      const userId = await resolveUserId(c);
      if (!userId)
        return c.json({ success: false, error: "User not found" }, 404);

      const { input, birthDate, language } = c.req.valid("json");

      // Fetch existing habits to avoid duplicate suggestions
      const db = c.get("db");
      const habitService = new HabitService(db);
      const existingHabits = await habitService.getHabits(userId);
      const existingList = existingHabits
        .map((h) => `${h.title} (${h.category})`)
        .join(", ");
      const existingClause =
        existingHabits.length > 0
          ? ` The user already has these habits: [${existingList}]. Do NOT suggest anything similar or overlapping. Suggest something different and complementary that fills a gap in their routine.`
          : "";

      const workerUrl = process.env.WORKER_URL || "http://localhost:8787";
      const prompt = input
        ? `The user wants to build a habit about: "${input}". Based on their Balinese birth chart (Wariga), suggest the best habit for them.${existingClause} Return ONLY a valid JSON object with these fields: title (string, max 50 chars), description (string, max 120 chars), category (one of: health, mindfulness, fitness, learning, finance, social, creativity, spiritual), frequency (one of: daily, weekly), targetCount (number 1-10), scheduledTime (HH:MM or null). No markdown, no explanation, just the JSON.`
        : `Based on the user's Balinese birth chart (Wariga), suggest a healthy daily habit that would be most beneficial for them right now.${existingClause} Return ONLY a valid JSON object with these fields: title (string, max 50 chars), description (string, max 120 chars), category (one of: health, mindfulness, fitness, learning, finance, social, creativity, spiritual), frequency (one of: daily, weekly), targetCount (number 1-10), scheduledTime (HH:MM or null). No markdown, no explanation, just the JSON.`;

      const oracleRes = await fetch(`${workerUrl}/api/oracle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          birthDate,
          language: language || "en",
        }),
      });

      if (!oracleRes.ok) {
        throw new Error(`Oracle service returned ${oracleRes.status}`);
      }

      const oracleData = (await oracleRes.json()) as {
        success: boolean;
        message: string;
      };
      if (!oracleData.success || !oracleData.message) {
        throw new Error("Invalid oracle response");
      }

      // Extract JSON from AI response (may have markdown wrapping)
      const raw = oracleData.message;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON");
      }

      const suggestion = JSON.parse(jsonMatch[0]) as {
        title: string;
        description: string;
        category: string;
        frequency: string;
        targetCount: number;
        scheduledTime: string | null;
      };

      return c.json({ success: true, suggestion });
    } catch (error) {
      log.error({ err: error as Error }, "Failed to get AI habit suggestion");
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to get suggestion",
        },
        500
      );
    }
  }
);

habitRoutes.get("/:habitId", async (c) => {
  try {
    const userId = await resolveUserId(c);
    if (!userId)
      return c.json({ success: false, error: "User not found" }, 404);

    const habitId = c.req.param("habitId");
    const db = c.get("db");
    const habitService = new HabitService(db);
    const habit = await habitService.getHabitById(habitId);

    if (!habit)
      return c.json({ success: false, error: "Habit not found" }, 404);
    if (habit.userId !== userId)
      return c.json({ success: false, error: "Forbidden" }, 403);

    return c.json({ success: true, habit });
  } catch (error) {
    log.error({ err: error as Error }, "Failed to get habit");
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get habit",
      },
      500
    );
  }
});

habitRoutes.post("/", zValidator("json", createHabitSchema), async (c) => {
  try {
    const userId = await resolveUserId(c);
    if (!userId)
      return c.json({ success: false, error: "User not found" }, 404);

    const data = c.req.valid("json");
    const db = c.get("db");
    const habitService = new HabitService(db);
    const habit = await habitService.createHabit(userId, data);

    return c.json({ success: true, habit }, 201);
  } catch (error) {
    log.error({ err: error as Error }, "Failed to create habit");
    const status =
      error instanceof Error && error.message.includes("Maximum") ? 400 : 500;
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create habit",
      },
      status
    );
  }
});

habitRoutes.put(
  "/:habitId",
  zValidator("json", updateHabitSchema),
  async (c) => {
    try {
      const userId = await resolveUserId(c);
      if (!userId)
        return c.json({ success: false, error: "User not found" }, 404);

      const habitId = c.req.param("habitId");
      const data = c.req.valid("json");
      const db = c.get("db");
      const habitService = new HabitService(db);
      const habit = await habitService.updateHabit(habitId, userId, data);

      if (!habit)
        return c.json({ success: false, error: "Habit not found" }, 404);

      return c.json({ success: true, habit });
    } catch (error) {
      log.error({ err: error as Error }, "Failed to update habit");
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to update habit",
        },
        500
      );
    }
  }
);

habitRoutes.post("/:habitId/archive", async (c) => {
  try {
    const userId = await resolveUserId(c);
    if (!userId)
      return c.json({ success: false, error: "User not found" }, 404);

    const habitId = c.req.param("habitId");
    const db = c.get("db");
    const habitService = new HabitService(db);
    const habit = await habitService.archiveHabit(habitId, userId);

    if (!habit)
      return c.json({ success: false, error: "Habit not found" }, 404);

    return c.json({ success: true, habit });
  } catch (error) {
    log.error({ err: error as Error }, "Failed to archive habit");
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to archive habit",
      },
      500
    );
  }
});

habitRoutes.delete("/:habitId", async (c) => {
  try {
    const userId = await resolveUserId(c);
    if (!userId)
      return c.json({ success: false, error: "User not found" }, 404);

    const habitId = c.req.param("habitId");
    const db = c.get("db");
    const habitService = new HabitService(db);
    const deleted = await habitService.deleteHabit(habitId, userId);

    if (!deleted)
      return c.json({ success: false, error: "Habit not found" }, 404);

    return c.json({ success: true });
  } catch (error) {
    log.error({ err: error as Error }, "Failed to delete habit");
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete habit",
      },
      500
    );
  }
});

habitRoutes.post(
  "/:habitId/complete",
  zValidator("json", completeHabitSchema),
  async (c) => {
    try {
      const userId = await resolveUserId(c);
      if (!userId)
        return c.json({ success: false, error: "User not found" }, 404);

      const habitId = c.req.param("habitId");
      const data = c.req.valid("json");
      const db = c.get("db");
      const habitService = new HabitService(db);
      const result = await habitService.completeHabit(habitId, userId, data);

      return c.json({ success: true, ...result });
    } catch (error) {
      log.error({ err: error as Error }, "Failed to complete habit");
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to complete habit",
        },
        500
      );
    }
  }
);

habitRoutes.get(
  "/:habitId/completions",
  zValidator("query", dateRangeSchema),
  async (c) => {
    try {
      const userId = await resolveUserId(c);
      if (!userId)
        return c.json({ success: false, error: "User not found" }, 404);

      const habitId = c.req.param("habitId");
      const { from, to } = c.req.valid("query");

      // Verify ownership
      const db = c.get("db");
      const habitService = new HabitService(db);
      const habit = await habitService.getHabitById(habitId);
      if (!habit || habit.userId !== userId) {
        return c.json({ success: false, error: "Habit not found" }, 404);
      }

      const completions = await habitService.getCompletionsRange(
        userId,
        from,
        to
      );
      const filtered = completions.filter((comp) => comp.habitId === habitId);

      return c.json({ success: true, completions: filtered });
    } catch (error) {
      log.error({ err: error as Error }, "Failed to get completions");
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get completions",
        },
        500
      );
    }
  }
);
