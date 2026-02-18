import { zValidator } from "@hono/zod-validator";
import { UserService, ReadingService, type Database } from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import { USER_INTERESTS } from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";
import { Hono } from "hono";
import { z } from "zod";

const log = createLogger({ name: "user" });

import { type AuthEnv } from "../middleware/paseto-auth";

type Env = AuthEnv & {
  Variables: AuthEnv["Variables"] & {
    db: Database;
    adminWalletAddress: string | undefined;
  };
};

export const userRoutes = new Hono<Env>();

const calculator = new NeptuCalculator();

const createUserSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  email: z.string().email().optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  chainType: z.enum(["solana", "evm"]).default("solana"),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  interests: z.array(z.enum(USER_INTERESTS)).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const onboardUserSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  displayName: z.string().min(1).max(50).optional(),
  interests: z.array(z.enum(USER_INTERESTS)).optional(),
});

/**
 * GET /api/users/:walletAddress
 * Get user by wallet address
 */
userRoutes.get("/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const db = c.get("db");
  const adminWalletAddress = c.get("adminWalletAddress");
  const userService = new UserService(db);

  const user = await userService.getUserByWallet(walletAddress);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  // Sync admin status if needed (handled gracefully if column doesn't exist)
  const shouldBeAdmin = !!(
    adminWalletAddress && walletAddress === adminWalletAddress
  );
  if (shouldBeAdmin !== user.isAdmin) {
    try {
      await userService.setAdminStatus(user.id, shouldBeAdmin);
      user.isAdmin = shouldBeAdmin;
    } catch (e) {
      // Column may not exist in older databases - ignore
      log.warn("Could not set admin status: %o", e);
    }
  }

  return c.json({ success: true, user });
});

/**
 * POST /api/users
 * Create or get existing user
 */
userRoutes.post("/", zValidator("json", createUserSchema), async (c) => {
  const { walletAddress, email } = c.req.valid("json");
  const db = c.get("db");
  const adminWalletAddress = c.get("adminWalletAddress");
  const userService = new UserService(db);

  const user = await userService.getOrCreateUser(walletAddress, email);

  // Check if this wallet should be admin (handled gracefully if column doesn't exist)
  const shouldBeAdmin =
    adminWalletAddress && walletAddress === adminWalletAddress;
  if (shouldBeAdmin && !user.isAdmin) {
    try {
      await userService.setAdminStatus(user.id, true);
      user.isAdmin = true;
    } catch (e) {
      // Column may not exist in older databases - ignore
      log.warn("Could not set admin status: %o", e);
    }
  }

  return c.json({ success: true, user });
});

/**
 * POST /api/users/:walletAddress/onboard
 * Complete user onboarding (set birthday, interests)
 */
userRoutes.post(
  "/:walletAddress/onboard",
  zValidator("json", onboardUserSchema),
  async (c) => {
    const walletAddress = c.req.param("walletAddress");
    const data = c.req.valid("json");
    const db = c.get("db");
    const userService = new UserService(db);

    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    // If already onboarded, just return success with existing user
    if (user.onboarded) {
      return c.json({ success: true, user, alreadyOnboarded: true });
    }

    const updatedUser = await userService.onboardUser(user.id, data);
    return c.json({ success: true, user: updatedUser });
  }
);

/**
 * PUT /api/users/:walletAddress
 * Update user profile
 */
userRoutes.put(
  "/:walletAddress",
  zValidator("json", updateUserSchema),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");
      const updates = c.req.valid("json");
      const db = c.get("db");
      const userService = new UserService(db);

      const user = await userService.getUserByWallet(walletAddress);
      if (!user) {
        return c.json({ success: false, error: "User not found" }, 404);
      }

      await userService.updateUser(user.id, updates);

      const updatedUser = await userService.getUserByWallet(walletAddress);
      return c.json({ success: true, user: updatedUser });
    } catch (error) {
      log.error("Update user error: %o", error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  }
);

/**
 * GET /api/users/:walletAddress/reading
 * Get user's personal reading (potensi + target date's peluang)
 * Query params: targetDate (optional, defaults to today)
 */
userRoutes.get("/:walletAddress/reading", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const targetDateParam = c.req.query("targetDate");
  const db = c.get("db");
  const userService = new UserService(db);
  const readingService = new ReadingService(db);

  const user = await userService.getUserByWallet(walletAddress);
  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  if (!user.birthDate) {
    return c.json(
      {
        success: false,
        error: "Birth date not set",
        requiresBirthDate: true,
      },
      400
    );
  }

  const birthDate = new Date(user.birthDate);
  const targetDate = targetDateParam ? new Date(targetDateParam) : new Date();
  const targetDateStr = targetDate.toISOString().split("T")[0];

  // Calculate potensi (life potential based on birth date)
  const potensi = calculator.calculatePotensi(birthDate);

  // Calculate peluang (opportunity for target date, considering birth date)
  const peluang = calculator.calculatePeluang(targetDate, birthDate);

  // Get full reading
  const fullReading = calculator.getFullReading(birthDate, targetDate);

  // Save reading to database
  await readingService.createReading({
    userId: user.id,
    type: "potensi",
    targetDate: targetDateStr,
    birthDate: user.birthDate,
    readingData: JSON.stringify(fullReading),
  });

  return c.json({
    success: true,
    user: {
      walletAddress: user.walletAddress,
      birthDate: user.birthDate,
    },
    reading: {
      potensi,
      peluang,
      full: fullReading,
      date: targetDateStr,
    },
  });
});

/**
 * GET /api/users/:walletAddress/readings
 * Get user's reading history
 */
userRoutes.get("/:walletAddress/readings", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const limit = Number(c.req.query("limit")) || 10;
  const db = c.get("db");
  const userService = new UserService(db);
  const readingService = new ReadingService(db);

  const user = await userService.getUserByWallet(walletAddress);
  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  const readings = await readingService.getReadingsByUser({
    userId: user.id,
    limit,
  });

  return c.json({ success: true, readings });
});
