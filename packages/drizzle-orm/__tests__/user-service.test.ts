import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { sql } from "drizzle-orm";
import { UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";

describe("UserService", () => {
  let userService: UserService;

  beforeAll(async () => {
    const db = createTestDatabase();

    // Create tables for in-memory database
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT NOT NULL UNIQUE,
        email TEXT,
        display_name TEXT,
        birth_date TEXT,
        interests TEXT,
        onboarded INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    userService = new UserService(db);
  });

  afterAll(() => {
    closeTestDatabase();
  });

  test("should create user with wallet address", async () => {
    const walletAddress = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    const user = await userService.createUser({ walletAddress });

    expect(user).toBeDefined();
    expect(user.walletAddress).toBe(walletAddress);
    expect(user.id).toBeDefined();
  });

  test("should get user by wallet address", async () => {
    const walletAddress = "7KQNqLgVr5xMfWdF9vTp6t6rUJp2NHrKdFPQHkAaLvgC";
    await userService.createUser({ walletAddress });

    const user = await userService.getUserByWallet(walletAddress);
    expect(user).toBeDefined();
    expect(user?.walletAddress).toBe(walletAddress);
  });

  test("should return null for non-existent user", async () => {
    const user = await userService.getUserByWallet("nonexistent");
    expect(user).toBeNull();
  });

  test("should onboard user with birthday and interests", async () => {
    const walletAddress = "8XYBnXu5J4C2qL9T7kP3mAeZ6sH4wRvFcGyN2dKj1bMx";
    const created = await userService.createUser({ walletAddress });

    const onboarded = await userService.onboardUser(created.id, {
      birthDate: "1990-08-17",
      displayName: "Test User",
      interests: ["career", "spirituality"],
    });

    expect(onboarded).toBeDefined();
    expect(onboarded?.birthDate).toBe("1990-08-17");
    expect(onboarded?.displayName).toBe("Test User");
    expect(onboarded?.interests).toContain("career");
    expect(onboarded?.onboarded).toBe(true);
  });

  test("should update user profile (not birthday)", async () => {
    const walletAddress = "6ABCdEf9G8H2iJ5K7lM3nOpQ6rS4tUvWxYz1aBcD2eFg";
    const created = await userService.createUser({ walletAddress });

    const updated = await userService.updateUser(created.id, {
      displayName: "New Name",
      interests: ["love", "health"],
    });

    expect(updated).toBeDefined();
    expect(updated?.displayName).toBe("New Name");
    expect(updated?.interests).toContain("love");
  });

  test("should get or create user", async () => {
    const walletAddress = "4RtVnKx9B8C2yL5T7dP3mFeZ6sH4wQvFcGyN2dKj1aMz";

    const user1 = await userService.getOrCreateUser(walletAddress);
    const user2 = await userService.getOrCreateUser(walletAddress);

    expect(user1.id).toBe(user2.id);
  });
});
