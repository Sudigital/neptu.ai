import { describe, test, expect, beforeAll, afterAll } from "bun:test";

import { sql } from "drizzle-orm";

import { ReferralService, UserService } from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";

const TEST_PREFIX = `r${Date.now()}`;

describe("ReferralService", () => {
  let referralService: ReferralService;
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  let referrerUserId: string;
  let refereeUserId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    db = createTestDatabase();
    referralService = new ReferralService(db);
    userService = new UserService(db);

    const referrer = await userService.createUser({
      walletAddress: `${TEST_PREFIX}ReferrerUsr123456789012345`,
    });
    const referee = await userService.createUser({
      walletAddress: `${TEST_PREFIX}RefereeUsr1234567890123456`,
    });
    referrerUserId = referrer.id;
    refereeUserId = referee.id;
    createdUserIds.push(referrer.id, referee.id);
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      try {
        await db.execute(sql`DELETE FROM user_rewards WHERE user_id = ${id}`);
        await db.execute(
          sql`DELETE FROM referrals WHERE referrer_id = ${id} OR referee_id = ${id}`
        );
        await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    await closeTestDatabase();
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
      })
    ).rejects.toThrow("User has already been referred");
  });

  test("should not allow self-referral", async () => {
    await expect(
      referralService.createReferral({
        referrerId: referrerUserId,
        refereeId: referrerUserId,
      })
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
      referrerUserId
    );

    expect(isValid).toBe(true);
  });

  test("should not validate incorrect referral code", async () => {
    const isValid = await referralService.validateReferralCode(
      "NEPTU-INVALID1",
      referrerUserId
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
