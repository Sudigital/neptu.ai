// ============================================================================
// API Pricing Constants
// ============================================================================

export const API_SCOPES = [
  "neptu:read",
  "neptu:write",
  "neptu:ai",
  "neptu:admin",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export const API_TIERS = ["starter", "pro", "business", "enterprise"] as const;

export type ApiTier = (typeof API_TIERS)[number];

export const API_SUBSCRIPTION_STATUS = [
  "active",
  "paused",
  "cancelled",
  "expired",
] as const;

export type ApiSubscriptionStatus = (typeof API_SUBSCRIPTION_STATUS)[number];

export const API_BILLING_PERIOD = ["monthly", "yearly"] as const;

export type ApiBillingPeriod = (typeof API_BILLING_PERIOD)[number];

export const API_PAYMENT_METHODS = ["sol", "neptu", "sudigital"] as const;

export type ApiPaymentMethod = (typeof API_PAYMENT_METHODS)[number];

export const API_ENDPOINT_CREDITS = {
  BASIC_CALL: 1,
  AI_ORACLE_CALL: 10,
  AI_INTERPRETATION_CALL: 5,
  BATCH_CALL: 5,
} as const;

export const API_RATE_LIMITS = {
  STARTER: 60,
  PRO: 120,
  BUSINESS: 300,
  ENTERPRISE: 1000,
} as const;

export const API_PRICING_PLANS = {
  STARTER: {
    tier: "starter" as const,
    priceUsd: 7.5,
    priceSol: 0.05,
    priceNeptu: 50,
    basicCalls: 1000,
    aiCalls: 100,
    rateLimit: 60,
    discountPercent: 0,
  },
  PRO: {
    tier: "pro" as const,
    priceUsd: 60,
    priceSol: 0.4,
    priceNeptu: 400,
    basicCalls: 10000,
    aiCalls: 1000,
    rateLimit: 120,
    discountPercent: 20,
  },
  BUSINESS: {
    tier: "business" as const,
    priceUsd: 450,
    priceSol: 3,
    priceNeptu: 3000,
    basicCalls: 100000,
    aiCalls: 10000,
    rateLimit: 300,
    discountPercent: 40,
  },
  ENTERPRISE: {
    tier: "enterprise" as const,
    priceUsd: 0,
    priceSol: 0,
    priceNeptu: 0,
    basicCalls: -1,
    aiCalls: -1,
    rateLimit: 1000,
    discountPercent: 0,
  },
} as const;

export const API_CREDIT_PACKS = {
  STARTER: {
    credits: 500,
    aiCredits: 50,
    priceUsd: 7.5,
    priceSol: 0.05,
    priceNeptu: 50,
    bonusPercent: 0,
  },
  GROWTH: {
    credits: 5000,
    aiCredits: 500,
    priceUsd: 60,
    priceSol: 0.4,
    priceNeptu: 400,
    bonusPercent: 10,
  },
  SCALE: {
    credits: 50000,
    aiCredits: 5000,
    priceUsd: 450,
    priceSol: 3,
    priceNeptu: 3000,
    bonusPercent: 20,
  },
} as const;

export const API_OVERAGE_RATES = {
  BASIC_CALL_NEPTU: 0.1,
  BASIC_CALL_SOL: 0.0001,
  AI_CALL_NEPTU: 1,
  AI_CALL_SOL: 0.001,
} as const;
