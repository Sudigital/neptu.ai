import { describe, test, expect, beforeAll, afterAll } from "bun:test";

import { sql } from "drizzle-orm";

import {
  ApiPricingPlanService,
  ApiKeyService,
  ApiSubscriptionService,
  ApiUsageService,
  ApiCreditPackService,
  UserService,
} from "../src";
import { createTestDatabase, closeTestDatabase } from "./test-helper";

const TEST_PREFIX = `p${Date.now()}`;

describe("API Pricing Services", () => {
  let planService: ApiPricingPlanService;
  let keyService: ApiKeyService;
  let subscriptionService: ApiSubscriptionService;
  let usageService: ApiUsageService;
  let creditPackService: ApiCreditPackService;
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;

  let testUserId: string;
  const createdPlanIds: string[] = [];
  const createdKeyIds: string[] = [];
  const createdSubscriptionIds: string[] = [];
  const createdPackIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    db = createTestDatabase();
    planService = new ApiPricingPlanService(db);
    keyService = new ApiKeyService(db);
    subscriptionService = new ApiSubscriptionService(db);
    usageService = new ApiUsageService(db);
    creditPackService = new ApiCreditPackService(db);
    userService = new UserService(db);

    const user = await userService.createUser({
      walletAddress: `${TEST_PREFIX}PricingTestUsr1234567890`,
    });
    testUserId = user.id;
    createdUserIds.push(user.id);
  });

  afterAll(async () => {
    for (const id of createdKeyIds) {
      try {
        await db.execute(sql`DELETE FROM api_usage WHERE api_key_id = ${id}`);
        await db.execute(sql`DELETE FROM api_keys WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    for (const id of createdSubscriptionIds) {
      try {
        await db.execute(sql`DELETE FROM api_subscriptions WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    for (const id of createdPlanIds) {
      try {
        await db.execute(sql`DELETE FROM api_pricing_plans WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    for (const id of createdPackIds) {
      try {
        await db.execute(sql`DELETE FROM api_credit_packs WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    for (const id of createdUserIds) {
      try {
        await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    await closeTestDatabase();
  });

  describe("ApiPricingPlanService", () => {
    test("should create a pricing plan", async () => {
      const plan = await planService.createPlan({
        slug: `${TEST_PREFIX}-starter`,
        name: "Test Starter",
        description: "Test plan for starter tier",
        tier: "starter",
        priceUsd: 7.5,
        priceSol: 0.05,
        priceNeptu: 50,
        billingPeriod: "monthly",
        features: ["Basic API access"],
        limits: {
          basicCalls: 1000,
          aiCalls: 100,
          rateLimit: 60,
        },
        overageRates: {
          basicCallNeptu: 0.005,
          basicCallSol: 0.00003,
          aiCallNeptu: 0.02,
          aiCallSol: 0.0001,
        },
        discountPercent: 0,
        isActive: true,
        isPopular: false,
        sortOrder: 1,
      });

      createdPlanIds.push(plan.id);
      expect(plan).toBeDefined();
      expect(plan.slug).toBe(`${TEST_PREFIX}-starter`);
      expect(plan.priceUsd).toBe(7.5);
    });

    test("should get plan by slug", async () => {
      const plan = await planService.getPlanBySlug(`${TEST_PREFIX}-starter`);

      expect(plan).toBeDefined();
      expect(plan?.name).toBe("Test Starter");
    });

    test("should list active plans", async () => {
      const proPlan = await planService.createPlan({
        slug: `${TEST_PREFIX}-pro`,
        name: "Test Pro",
        tier: "pro",
        priceUsd: 60,
        priceSol: 0.4,
        priceNeptu: 400,
        billingPeriod: "monthly",
        features: ["Pro API access"],
        limits: {
          basicCalls: 10000,
          aiCalls: 1000,
          rateLimit: 120,
        },
        overageRates: {
          basicCallNeptu: 0.004,
          basicCallSol: 0.00002,
          aiCallNeptu: 0.018,
          aiCallSol: 0.00009,
        },
        discountPercent: 20,
        isActive: true,
        isPopular: true,
        sortOrder: 2,
      });

      createdPlanIds.push(proPlan.id);
      const plans = await planService.getActivePlans();

      expect(plans.length).toBeGreaterThanOrEqual(2);
      expect(plans.some((p) => p.slug === `${TEST_PREFIX}-starter`)).toBe(true);
      expect(plans.some((p) => p.slug === `${TEST_PREFIX}-pro`)).toBe(true);
    });

    test("should update plan", async () => {
      const plan = await planService.getPlanBySlug(`${TEST_PREFIX}-starter`);
      if (!plan) throw new Error("Plan not found");

      const updated = await planService.updatePlan(plan.id, {
        description: "Updated description",
        priceUsd: 9.99,
      });

      expect(updated?.description).toBe("Updated description");
      expect(updated?.priceUsd).toBe(9.99);
    });
  });

  describe("ApiKeyService", () => {
    test("should create API key", async () => {
      const result = await keyService.createKey(testUserId, {
        name: "Test API Key",
        scopes: ["neptu:read", "neptu:ai"],
      });

      createdKeyIds.push(result.id);
      expect(result).toBeDefined();
      expect(result.name).toBe("Test API Key");
      expect(result.secret).toMatch(/^nptu_/);
    });

    test("should validate API key", async () => {
      const result = await keyService.createKey(testUserId, {
        name: "Validate Test Key",
        scopes: ["neptu:read"],
      });

      createdKeyIds.push(result.id);
      const validated = await keyService.validateKey(result.secret);

      expect(validated).toBeDefined();
      expect(validated?.name).toBe("Validate Test Key");
    });

    test("should reject invalid API key", async () => {
      const validated = await keyService.validateKey("invalid_key");
      expect(validated).toBeNull();
    });

    test("should list user API keys", async () => {
      const keys = await keyService.getKeysByUserId(testUserId);

      expect(keys.length).toBeGreaterThanOrEqual(2);
      expect(keys.every((k) => k.userId === testUserId)).toBe(true);
    });

    test("should revoke API key", async () => {
      const result = await keyService.createKey(testUserId, {
        name: "To Revoke",
        scopes: ["neptu:read"],
      });

      createdKeyIds.push(result.id);
      const revoked = await keyService.revokeKey(result.id, testUserId);

      expect(revoked).toBe(true);
    });
  });

  describe("ApiSubscriptionService", () => {
    let testPlanId: string;
    let testSubscriptionId: string;

    beforeAll(async () => {
      const plan = await planService.getPlanBySlug(`${TEST_PREFIX}-starter`);
      if (!plan) throw new Error("Test plan not found");
      testPlanId = plan.id;
    });

    test("should create subscription", async () => {
      const subscription = await subscriptionService.createSubscription(
        testUserId,
        {
          planId: testPlanId,
          paymentMethod: "sol",
          paymentTxSignature: `test_tx_sig_${TEST_PREFIX}`,
        }
      );

      createdSubscriptionIds.push(subscription.id);
      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe(testUserId);
      expect(subscription.status).toBe("active");
      testSubscriptionId = subscription.id;
    });

    test("should get active subscription by user", async () => {
      const subscription =
        await subscriptionService.getActiveSubscription(testUserId);

      expect(subscription).toBeDefined();
      expect(subscription?.userId).toBe(testUserId);
    });

    test("should get subscription by id", async () => {
      const subscription =
        await subscriptionService.getSubscriptionById(testSubscriptionId);

      expect(subscription).toBeDefined();
      expect(subscription?.id).toBe(testSubscriptionId);
    });

    test("should use credits", async () => {
      const result = await subscriptionService.useCredits(testUserId, 10, 5);

      expect(result.success).toBe(true);
      expect(result.remaining.basic).toBeGreaterThanOrEqual(0);
    });

    test("should cancel subscription", async () => {
      const cancelled = await subscriptionService.cancelSubscription(
        testSubscriptionId,
        testUserId
      );

      expect(cancelled).toBe(true);
    });
  });

  describe("ApiUsageService", () => {
    let testApiKeyId: string;

    beforeAll(async () => {
      const result = await keyService.createKey(testUserId, {
        name: "Usage Test Key",
        scopes: ["neptu:read"],
      });
      testApiKeyId = result.id;
      createdKeyIds.push(result.id);
    });

    test("should record API usage", async () => {
      const usage = await usageService.recordUsage({
        apiKeyId: testApiKeyId,
        endpoint: "/api/v1/oracle/health",
        method: "GET",
        creditsUsed: 1,
        isAiEndpoint: false,
        responseStatus: 200,
        responseTimeMs: 45,
        ipAddress: "127.0.0.1",
        userAgent: "Test/1.0",
      });

      expect(usage).toBeDefined();
      expect(usage.endpoint).toBe("/api/v1/oracle/health");
      expect(usage.creditsUsed).toBe(1);
    });

    test("should get usage by API key", async () => {
      await usageService.recordUsage({
        apiKeyId: testApiKeyId,
        endpoint: "/api/v1/oracle/tokens",
        method: "GET",
        creditsUsed: 1,
        isAiEndpoint: false,
        responseStatus: 200,
        responseTimeMs: 50,
      });

      const usage = await usageService.getUsageByApiKeyId(testApiKeyId);

      expect(usage.length).toBeGreaterThanOrEqual(2);
      expect(usage[0].apiKeyId).toBe(testApiKeyId);
    });

    test("should get current month summary", async () => {
      const summary = await usageService.getCurrentMonthSummary(testApiKeyId);

      expect(summary).toBeDefined();
      expect(summary.totalCalls).toBeGreaterThanOrEqual(2);
    });
  });

  describe("ApiCreditPackService", () => {
    test("should create credit pack", async () => {
      const pack = await creditPackService.createPack({
        slug: `${TEST_PREFIX}-small`,
        name: "Test Small Pack",
        description: "Small credit pack for testing",
        credits: 1000,
        aiCredits: 100,
        bonusPercent: 0,
        priceUsd: 5,
        priceSol: 0.033,
        priceNeptu: 33,
        isActive: true,
        sortOrder: 1,
      });

      createdPackIds.push(pack.id);
      expect(pack).toBeDefined();
      expect(pack.slug).toBe(`${TEST_PREFIX}-small`);
      expect(pack.credits).toBe(1000);
    });

    test("should get credit pack by slug", async () => {
      const pack = await creditPackService.getPackBySlug(
        `${TEST_PREFIX}-small`
      );

      expect(pack).toBeDefined();
      expect(pack?.name).toBe("Test Small Pack");
    });

    test("should list active credit packs", async () => {
      const pack = await creditPackService.createPack({
        slug: `${TEST_PREFIX}-medium`,
        name: "Test Medium Pack",
        credits: 5000,
        aiCredits: 500,
        priceUsd: 20,
        priceSol: 0.133,
        priceNeptu: 133,
        bonusPercent: 10,
        isActive: true,
        sortOrder: 2,
      });

      createdPackIds.push(pack.id);
      const packs = await creditPackService.getActivePacks();

      expect(packs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Admin Methods", () => {
    test("should list subscriptions with pagination", async () => {
      const result = await subscriptionService.listSubscriptions({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
    });

    test("should list subscriptions filtered by status", async () => {
      const result = await subscriptionService.listSubscriptions({
        page: 1,
        limit: 10,
        status: "active",
      });

      expect(result).toBeDefined();
      result.data.forEach((sub) => {
        expect(sub.status).toBe("active");
      });
    });

    test("should get subscription stats", async () => {
      const stats = await subscriptionService.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.active).toBe("number");
      expect(typeof stats.cancelled).toBe("number");
      expect(typeof stats.expired).toBe("number");
      expect(typeof stats.totalRevenue).toBe("number");
    });

    test("should get usage stats", async () => {
      const stats = await usageService.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalCalls).toBe("number");
      expect(typeof stats.todayCalls).toBe("number");
      expect(typeof stats.totalCreditsUsed).toBe("number");
      expect(typeof stats.avgResponseTime).toBe("number");
    });

    test("should get top endpoints", async () => {
      const endpoints = await usageService.getTopEndpoints(5);

      expect(endpoints).toBeInstanceOf(Array);
      endpoints.forEach((ep) => {
        expect(ep).toHaveProperty("endpoint");
        expect(ep).toHaveProperty("method");
        expect(ep).toHaveProperty("totalCalls");
      });
    });

    test("should list API keys with pagination", async () => {
      const result = await keyService.listKeys({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
    });

    test("should list API keys filtered by active status", async () => {
      const result = await keyService.listKeys({
        page: 1,
        limit: 10,
        isActive: true,
      });

      expect(result).toBeDefined();
      result.data.forEach((key) => {
        expect(key.isActive).toBeTruthy();
      });
    });
  });
});
