import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { sql } from "drizzle-orm";
import { ReferralService, UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";

describe("ReferralService", () => {
  let referralService: ReferralService;
  let userService: UserService;
  let referrerUserId: string;
  let refereeUserId: string;

  beforeAll(async () => {
    const db = createTestDatabase();

    // Create tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT UNIQUE NOT NULL,
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

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        referrer_id TEXT NOT NULL REFERENCES users(id),
        referee_id TEXT UNIQUE NOT NULL REFERENCES users(id),
        referrer_reward_amount REAL,
        referee_reward_amount REAL,
        referrer_reward_paid TEXT NOT NULL DEFAULT 'pending',
        referee_reward_paid TEXT NOT NULL DEFAULT 'pending',
        referrer_reward_tx_signature TEXT,
        referee_reward_tx_signature TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_rewards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        reward_type TEXT NOT NULL,
        neptu_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        claim_tx_signature TEXT,
        claimed_at TEXT,
        expires_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    referralService = new ReferralService(db);
    userService = new UserService(db);

    // Create test users
    const referrer = await userService.createUser({
      walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAReferrerX",
    });
    const referee = await userService.createUser({
      walletAddress: "7KQNqLgVr5xMfWdF9vTp6t6rURefereeX",
    });
    referrerUserId = referrer.id;
    refereeUserId = referee.id;
  });

  afterAll(() => {
    closeTestDatabase();
  });

  test("should create referral", async () => {
    const referral = await referralService.createReferral({
      referrerId: referrerUserId,
      refereeId: refereeUserId,
    });

    expect(referral).toBeDefined();
    expect(referral.referrerId).toBe(referrerUserId);
    expect(referral.refereeId).toBe(refereeUserId);
    expect(referral.referrerRewardPaid).toBe("pending");
    expect(referral.refereeRewardPaid).toBe("pending");
  });

  test("should not allow duplicate referee referral", async () => {
    await expect(
      referralService.createReferral({
        referrerId: referrerUserId,
        refereeId: refereeUserId,
      }),
    ).rejects.toThrow("User has already been referred");
  });

  test("should not allow self-referral", async () => {
    await expect(
      referralService.createReferral({
        referrerId: referrerUserId,
        refereeId: referrerUserId,
      }),
    ).rejects.toThrow("Cannot refer yourself");
  });

  test("should get referral by referee", async () => {
    const referral = await referralService.getReferralByReferee(refereeUserId);

    expect(referral).toBeDefined();
    expect(referral?.refereeId).toBe(refereeUserId);
  });

  test("should get user referrals", async () => {
    const referrals = await referralService.getUserReferrals(referrerUserId);

    expect(referrals.length).toBe(1);
  });

  test("should get referral count", async () => {
    const count = await referralService.getReferralCount(referrerUserId);

    expect(count).toBe(1);
  });

  test("should generate referral code", () => {
    const code = referralService.generateReferralCode(referrerUserId);

    expect(code).toMatch(/^NEPTU-[A-Z0-9]{8}$/);
  });

  test("should validate referral code", async () => {
    const code = referralService.generateReferralCode(referrerUserId);
    const isValid = await referralService.validateReferralCode(
      code,
      referrerUserId,
    );

    expect(isValid).toBe(true);
  });

  test("should not validate incorrect referral code", async () => {
    const isValid = await referralService.validateReferralCode(
      "NEPTU-INVALID1",
      referrerUserId,
    );

    expect(isValid).toBe(false);
  });

  test("should get referral stats", async () => {
    const stats = await referralService.getReferralStats(referrerUserId);

    expect(stats.totalReferrals).toBe(1);
    expect(stats.successfulReferrals).toBe(0);
    expect(stats.pendingRewardsCount).toBe(1);
    expect(stats.totalEarned).toBe(0);
  });

  test("should get pending referrer rewards", async () => {
    const pending =
      await referralService.getPendingReferrerRewards(referrerUserId);

    expect(pending.length).toBe(1);
  });
});
