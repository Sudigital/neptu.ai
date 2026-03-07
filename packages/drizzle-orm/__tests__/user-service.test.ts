import { describe, test, expect, beforeAll, afterAll } from "bun:test";

import { sql } from "drizzle-orm";

import { UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";

// Generate unique test prefix to avoid conflicts (short to stay within 44 char limit)
const TEST_PREFIX = `u${Date.now()}`;

describe("UserService", () => {
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    db = createTestDatabase();
    userService = new UserService(db);
  });

  afterAll(async () => {
    // Clean up test users
    if (createdUserIds.length > 0) {
      for (const id of createdUserIds) {
        try {
          await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    await closeTestDatabase();
  });

  test("should create user with wallet address", async () => {
    const walletAddress = `${TEST_PREFIX}Create9WzDXwBbmkg8ZTbNMqU`;
    const user = await userService.createUser({ walletAddress });
    createdUserIds.push(user.id);

    expect(user).toBeDefined();
    expect(user.walletAddress).toBe(walletAddress);
    expect(user.id).toBeDefined();
  });

  test("should get user by wallet address", async () => {
    const walletAddress = `${TEST_PREFIX}GetUsr7KQNqLgVr5xMfWdF9v`;
    const created = await userService.createUser({ walletAddress });
    createdUserIds.push(created.id);

    const user = await userService.getUserByWallet(walletAddress);
    expect(user).toBeDefined();
    expect(user?.walletAddress).toBe(walletAddress);
  });

  test("should return null for non-existent user", async () => {
    const user = await userService.getUserByWallet(
      "NonExistentWallet123456789012345678901234"
    );
    expect(user).toBeNull();
  });

  test("should onboard user with birthday and interests", async () => {
    const walletAddress = `${TEST_PREFIX}Onboard8XYBnXu5J4C2qL9T7`;
    const created = await userService.createUser({ walletAddress });
    createdUserIds.push(created.id);

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
    const walletAddress = `${TEST_PREFIX}Update6ABCdEf9G8H2iJ5K7l`;
    const created = await userService.createUser({ walletAddress });
    createdUserIds.push(created.id);

    const updated = await userService.updateUser(created.id, {
      displayName: "New Name",
      interests: ["love", "health"],
    });

    expect(updated).toBeDefined();
    expect(updated?.displayName).toBe("New Name");
    expect(updated?.interests).toContain("love");
  });

  test("should get or create user", async () => {
    const walletAddress = `${TEST_PREFIX}GetCreate4RtVnKx9B8C2yL5`;

    const user1 = await userService.getOrCreateUser(walletAddress);
    createdUserIds.push(user1.id);
    const user2 = await userService.getOrCreateUser(walletAddress);

    expect(user1.id).toBe(user2.id);
  });

  test("should get user by email", async () => {
    const walletAddress = `${TEST_PREFIX}EmailLookup8XYBnXu5J4C2q`;
    const email = `${TEST_PREFIX}@test.neptu.day`;
    const created = await userService.createUser({ walletAddress, email });
    createdUserIds.push(created.id);

    const user = await userService.getUserByEmail(email);
    expect(user).toBeDefined();
    expect(user?.email).toBe(email);
    expect(user?.walletAddress).toBe(walletAddress);
  });

  test("should return null for non-existent email", async () => {
    const user = await userService.getUserByEmail("nonexistent@test.neptu.day");
    expect(user).toBeNull();
  });

  test("should find existing user by email when getOrCreateUser is called", async () => {
    const walletAddress1 = `${TEST_PREFIX}EmailFirst6ABCdEf9G8H2iJ`;
    const walletAddress2 = `${TEST_PREFIX}EmailFirst7KLMnOp0Q1R3sT`;
    const email = `${TEST_PREFIX}-emailfirst@test.neptu.day`;

    // Create user with wallet1 + email
    const user1 = await userService.getOrCreateUser(walletAddress1, email);
    createdUserIds.push(user1.id);
    expect(user1.email).toBe(email);
    expect(user1.walletAddress).toBe(walletAddress1);

    // Login with wallet2 + same email → should find user by email, update wallet
    const user2 = await userService.getOrCreateUser(walletAddress2, email);
    expect(user2.id).toBe(user1.id);
    expect(user2.walletAddress).toBe(walletAddress2);
  });

  test("should find user by wallet when no email is provided", async () => {
    const walletAddress = `${TEST_PREFIX}WalletFB9XYZnXu5J4C2qL`;
    const user1 = await userService.getOrCreateUser(walletAddress);
    createdUserIds.push(user1.id);

    // Same wallet, no email → should still find the user
    const user2 = await userService.getOrCreateUser(walletAddress);
    expect(user2.id).toBe(user1.id);
  });

  test("should update email when found by wallet without email", async () => {
    const walletAddress = `${TEST_PREFIX}WalletEmail3KLMnOp0Q1R3`;
    const email = `${TEST_PREFIX}-walletemail@test.neptu.day`;

    // Create user without email
    const user1 = await userService.getOrCreateUser(walletAddress);
    createdUserIds.push(user1.id);
    expect(user1.email).toBeNull();

    // Same wallet, now with email → should update email
    const user2 = await userService.getOrCreateUser(walletAddress, email);
    expect(user2.id).toBe(user1.id);
    expect(user2.email).toBe(email);
  });

  test("should create new user when neither email nor wallet found", async () => {
    const walletAddress = `${TEST_PREFIX}NewUser5VWXyZ0A1B2C3D4E`;
    const email = `${TEST_PREFIX}-newuser@test.neptu.day`;

    const user = await userService.getOrCreateUser(walletAddress, email);
    createdUserIds.push(user.id);

    expect(user.walletAddress).toBe(walletAddress);
    expect(user.email).toBe(email);
  });

  describe("Admin Methods", () => {
    test("should list users with pagination", async () => {
      const result = await userService.listUsers({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    test("should list users with pagination and sort", async () => {
      const result = await userService.listUsers({
        page: 1,
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.limit).toBe(5);
    });

    test("should list users with search filter", async () => {
      const walletAddress = `${TEST_PREFIX}SearchTestWallet12345678`;
      const created = await userService.createUser({ walletAddress });
      createdUserIds.push(created.id);

      const result = await userService.listUsers({
        page: 1,
        limit: 10,
        search: TEST_PREFIX,
      });

      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    test("should get user stats", async () => {
      const stats = await userService.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.onboarded).toBe("number");
      expect(typeof stats.admins).toBe("number");
      expect(typeof stats.todayNew).toBe("number");
    });
  });
});
