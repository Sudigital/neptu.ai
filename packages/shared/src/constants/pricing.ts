// ============================================================================
// Token Constants
// ============================================================================

export const SOL_TOKEN = {
  SYMBOL: "SOL",
  NAME: "Solana",
  DECIMALS: 9,
} as const;

export const NEPTU_TOKEN = {
  SYMBOL: "NEPTU",
  NAME: "Neptu Token",
  DECIMALS: 6,
  TOTAL_SUPPLY: 1_000_000_000,
  REWARDS_POOL: 300_000_000,
  BURN_RATE: 0.5,
} as const;

export const SUDIGITAL_TOKEN = {
  SYMBOL: "SUDIGITAL",
  NAME: "SUDIGITAL Token",
  DECIMALS: 6,
  MINT: "7zsunv4pLAzVWGCQts2k266TYJuLJfMvHcMbcRSR8xqf",
} as const;

// ============================================================================
// Pricing Constants (in lamports for SOL, raw amount for NEPTU)
// ============================================================================

/** @deprecated Use SUBSCRIPTION_PLANS for new pricing model */
export const PRICING = {
  POTENSI: {
    SOL: 0.01,
    NEPTU: 10,
    SUDIGITAL: 10,
    NEPTU_REWARD: 10,
    SUDIGITAL_NEPTU_REWARD: 10,
  },
  PELUANG: {
    SOL: 0.001,
    NEPTU: 1,
    SUDIGITAL: 1,
    NEPTU_REWARD: 1,
    SUDIGITAL_NEPTU_REWARD: 1,
  },
  COMPATIBILITY: {
    SOL: 0.005,
    NEPTU: 5,
    SUDIGITAL: 5,
    NEPTU_REWARD: 5,
    SUDIGITAL_NEPTU_REWARD: 5,
  },
  AI_CHAT: {
    SOL: 0.002,
    NEPTU: 2,
    SUDIGITAL: 2,
    NEPTU_REWARD: 2,
    SUDIGITAL_NEPTU_REWARD: 2,
  },
} as const;

export type ReadingType = keyof typeof PRICING;
export type PaymentType = "sol" | "neptu" | "sudigital";
export type PaymentStatus = "pending" | "confirmed" | "failed";

// ============================================================================
// Subscription Plans
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  FREE: {
    key: "FREE" as const,
    SOL: 0,
    NEPTU: 0,
    SUDIGITAL: 0,
    calendarDays: 0,
    aiFeedback: false,
    interest: false,
    aiChat: false,
  },
  WEEKLY: {
    key: "WEEKLY" as const,
    SOL: 0.005,
    NEPTU: 5,
    SUDIGITAL: 5,
    calendarDays: 7,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
  MONTHLY: {
    key: "MONTHLY" as const,
    SOL: 0.015,
    NEPTU: 15,
    SUDIGITAL: 15,
    calendarDays: 30,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
  YEARLY: {
    key: "YEARLY" as const,
    SOL: 0.1,
    NEPTU: 100,
    SUDIGITAL: 100,
    calendarDays: 365,
    aiFeedback: true,
    interest: true,
    aiChat: false,
  },
} as const;

export const AI_CHAT_ADDON = {
  PER_MESSAGE: { SOL: 0.002, NEPTU: 2, SUDIGITAL: 2 },
  PACK_10: { SOL: 0.01, NEPTU: 10, SUDIGITAL: 10 },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
