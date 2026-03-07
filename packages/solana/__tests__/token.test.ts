import { describe, expect, test } from "bun:test";

import {
  PRICING,
  NEPTU_TOKEN,
  SOL_TOKEN,
  SUDIGITAL_TOKEN,
  SKR_TOKEN,
  REWARD_TOKEN,
  GAMIFICATION_REWARDS,
} from "@neptu/shared";

import {
  solToLamports,
  lamportsToSol,
  neptuToRaw,
  rawToNeptu,
  sudigitalToRaw,
  rawToSudigital,
  LAMPORTS_PER_SOL,
  TOKEN_DECIMALS_MULTIPLIER,
  SUDIGITAL_DECIMALS_MULTIPLIER,
  DEVNET_ADDRESSES,
  MAINNET_ADDRESSES,
  getAddresses,
} from "../src/constants";
import {
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
  calculateSudigitalPayment,
  getReadingPrice,
} from "../src/token/reward";

describe("Constants", () => {
  test("LAMPORTS_PER_SOL is correct", () => {
    expect(LAMPORTS_PER_SOL).toBe(1_000_000_000);
  });

  test("TOKEN_DECIMALS_MULTIPLIER is correct", () => {
    expect(TOKEN_DECIMALS_MULTIPLIER).toBe(Math.pow(10, NEPTU_TOKEN.DECIMALS));
  });

  test("SOL_TOKEN has correct properties", () => {
    expect(SOL_TOKEN.SYMBOL).toBe("SOL");
    expect(SOL_TOKEN.NAME).toBe("Solana");
    expect(SOL_TOKEN.DECIMALS).toBe(9);
  });

  test("NEPTU_TOKEN has correct properties", () => {
    expect(NEPTU_TOKEN.SYMBOL).toBe("NEPTU");
    expect(NEPTU_TOKEN.DECIMALS).toBe(6);
  });
});

describe("SOL Conversion", () => {
  test("solToLamports converts correctly", () => {
    expect(solToLamports(1)).toBe(BigInt(1_000_000_000));
    expect(solToLamports(0.01)).toBe(BigInt(10_000_000));
    expect(solToLamports(0.001)).toBe(BigInt(1_000_000));
  });

  test("lamportsToSol converts correctly", () => {
    expect(lamportsToSol(BigInt(1_000_000_000))).toBe(1);
    expect(lamportsToSol(BigInt(10_000_000))).toBe(0.01);
    expect(lamportsToSol(BigInt(1_000_000))).toBe(0.001);
  });

  test("round-trip conversion is accurate", () => {
    const values = [0.001, 0.01, 0.1, 1, 10];
    for (const val of values) {
      expect(lamportsToSol(solToLamports(val))).toBe(val);
    }
  });
});

describe("NEPTU Conversion", () => {
  test("neptuToRaw converts correctly", () => {
    expect(neptuToRaw(1)).toBe(BigInt(1_000_000));
    expect(neptuToRaw(10)).toBe(BigInt(10_000_000));
    expect(neptuToRaw(0.5)).toBe(BigInt(500_000));
  });

  test("rawToNeptu converts correctly", () => {
    expect(rawToNeptu(BigInt(1_000_000))).toBe(1);
    expect(rawToNeptu(BigInt(10_000_000))).toBe(10);
    expect(rawToNeptu(BigInt(500_000))).toBe(0.5);
  });

  test("round-trip conversion is accurate", () => {
    const values = [1, 2, 5, 10, 50, 100];
    for (const val of values) {
      expect(rawToNeptu(neptuToRaw(val))).toBe(val);
    }
  });
});

describe("Reward Calculations", () => {
  test("calculateSolPaymentReward for POTENSI", () => {
    const result = calculateSolPaymentReward("POTENSI");
    expect(result.solAmount).toBe(solToLamports(PRICING.POTENSI.SOL));
    expect(result.neptuReward).toBe(neptuToRaw(PRICING.POTENSI.NEPTU_REWARD));
    expect(result.neptuRewardFormatted).toBe(PRICING.POTENSI.NEPTU_REWARD);
  });

  test("calculateSolPaymentReward for PELUANG", () => {
    const result = calculateSolPaymentReward("PELUANG");
    expect(result.solAmount).toBe(solToLamports(PRICING.PELUANG.SOL));
    expect(result.neptuReward).toBe(neptuToRaw(PRICING.PELUANG.NEPTU_REWARD));
    expect(result.neptuRewardFormatted).toBe(PRICING.PELUANG.NEPTU_REWARD);
  });

  test("calculateSolPaymentReward for AI_CHAT", () => {
    const result = calculateSolPaymentReward("AI_CHAT");
    expect(result.solAmount).toBe(solToLamports(PRICING.AI_CHAT.SOL));
    expect(result.neptuReward).toBe(neptuToRaw(PRICING.AI_CHAT.NEPTU_REWARD));
    expect(result.neptuRewardFormatted).toBe(PRICING.AI_CHAT.NEPTU_REWARD);
  });

  test("calculateSolPaymentReward for COMPATIBILITY", () => {
    const result = calculateSolPaymentReward("COMPATIBILITY");
    expect(result.solAmount).toBe(solToLamports(PRICING.COMPATIBILITY.SOL));
    expect(result.neptuReward).toBe(
      neptuToRaw(PRICING.COMPATIBILITY.NEPTU_REWARD)
    );
    expect(result.neptuRewardFormatted).toBe(
      PRICING.COMPATIBILITY.NEPTU_REWARD
    );
  });
});

describe("Burn Calculations", () => {
  test("calculateNeptuPaymentBurn for POTENSI burns 50%", () => {
    const result = calculateNeptuPaymentBurn("POTENSI");
    expect(result.neptuAmount).toBe(neptuToRaw(PRICING.POTENSI.NEPTU));
    expect(result.burnAmountFormatted).toBe(PRICING.POTENSI.NEPTU * 0.5);
    expect(result.treasuryAmountFormatted).toBe(PRICING.POTENSI.NEPTU * 0.5);
    expect(result.burnAmount + result.treasuryAmount).toBe(result.neptuAmount);
  });

  test("calculateNeptuPaymentBurn for PELUANG burns 50%", () => {
    const result = calculateNeptuPaymentBurn("PELUANG");
    expect(result.neptuAmount).toBe(neptuToRaw(PRICING.PELUANG.NEPTU));
    expect(result.burnAmountFormatted).toBe(PRICING.PELUANG.NEPTU * 0.5);
    expect(result.treasuryAmountFormatted).toBe(PRICING.PELUANG.NEPTU * 0.5);
  });

  test("burn + treasury equals total amount", () => {
    const readingTypes = [
      "POTENSI",
      "PELUANG",
      "AI_CHAT",
      "COMPATIBILITY",
    ] as const;
    for (const type of readingTypes) {
      const result = calculateNeptuPaymentBurn(type);
      expect(result.burnAmount + result.treasuryAmount).toBe(
        result.neptuAmount
      );
    }
  });
});

describe("Reading Prices", () => {
  test("getReadingPrice returns correct SOL price", () => {
    expect(getReadingPrice("POTENSI", "sol")).toBe(PRICING.POTENSI.SOL);
    expect(getReadingPrice("PELUANG", "sol")).toBe(PRICING.PELUANG.SOL);
    expect(getReadingPrice("AI_CHAT", "sol")).toBe(PRICING.AI_CHAT.SOL);
    expect(getReadingPrice("COMPATIBILITY", "sol")).toBe(
      PRICING.COMPATIBILITY.SOL
    );
  });

  test("getReadingPrice returns correct NEPTU price", () => {
    expect(getReadingPrice("POTENSI", "neptu")).toBe(PRICING.POTENSI.NEPTU);
    expect(getReadingPrice("PELUANG", "neptu")).toBe(PRICING.PELUANG.NEPTU);
    expect(getReadingPrice("AI_CHAT", "neptu")).toBe(PRICING.AI_CHAT.NEPTU);
    expect(getReadingPrice("COMPATIBILITY", "neptu")).toBe(
      PRICING.COMPATIBILITY.NEPTU
    );
  });

  test("getReadingPrice returns correct SUDIGITAL price", () => {
    expect(getReadingPrice("POTENSI", "sudigital")).toBe(
      PRICING.POTENSI.SUDIGITAL
    );
    expect(getReadingPrice("PELUANG", "sudigital")).toBe(
      PRICING.PELUANG.SUDIGITAL
    );
  });
});

describe("SUDIGITAL Token", () => {
  test("SUDIGITAL_TOKEN has correct properties", () => {
    expect(SUDIGITAL_TOKEN.SYMBOL).toBe("SUDIGITAL");
    expect(SUDIGITAL_TOKEN.DECIMALS).toBe(6);
    expect(SUDIGITAL_TOKEN.MINT).toBe(
      "7zsunv4pLAzVWGCQts2k266TYJuLJfMvHcMbcRSR8xqf"
    );
  });

  test("SUDIGITAL_DECIMALS_MULTIPLIER is correct", () => {
    expect(SUDIGITAL_DECIMALS_MULTIPLIER).toBe(
      Math.pow(10, SUDIGITAL_TOKEN.DECIMALS)
    );
  });

  test("sudigitalToRaw converts correctly", () => {
    expect(sudigitalToRaw(1)).toBe(BigInt(1_000_000));
    expect(sudigitalToRaw(10)).toBe(BigInt(10_000_000));
  });

  test("rawToSudigital converts correctly", () => {
    expect(rawToSudigital(BigInt(1_000_000))).toBe(1);
    expect(rawToSudigital(BigInt(10_000_000))).toBe(10);
  });

  test("round-trip conversion is accurate", () => {
    const values = [0.5, 1, 5, 10, 100];
    for (const val of values) {
      expect(rawToSudigital(sudigitalToRaw(val))).toBe(val);
    }
  });
});

describe("SUDIGITAL Payment Calculations", () => {
  test("calculateSudigitalPayment for POTENSI", () => {
    const result = calculateSudigitalPayment("POTENSI");
    expect(result.sudigitalAmount).toBe(
      sudigitalToRaw(PRICING.POTENSI.SUDIGITAL)
    );
    expect(result.sudigitalAmountFormatted).toBe(PRICING.POTENSI.SUDIGITAL);
    expect(result.neptuRewardFormatted).toBe(
      PRICING.POTENSI.SUDIGITAL_NEPTU_REWARD
    );
  });

  test("calculateSudigitalPayment for PELUANG", () => {
    const result = calculateSudigitalPayment("PELUANG");
    expect(result.sudigitalAmountFormatted).toBe(PRICING.PELUANG.SUDIGITAL);
  });
});

describe("SKR Token", () => {
  test("SKR_TOKEN has correct properties", () => {
    expect(SKR_TOKEN.SYMBOL).toBe("SKR");
    expect(SKR_TOKEN.NAME).toBe("Seeker Rewards");
    expect(SKR_TOKEN.DECIMALS).toBe(6);
    expect(SKR_TOKEN.MINT_MAINNET).toBe(
      "SKRsqngVhJKCAE2rLGXhJGxVnMTiPjCcoFWxSimdquC"
    );
  });
});

describe("Reward Token Network Config", () => {
  test("devnet reward token is SUDIGITAL", () => {
    expect(REWARD_TOKEN.devnet.symbol).toBe("SUDIGITAL");
    expect(REWARD_TOKEN.devnet.mint).toBe(SUDIGITAL_TOKEN.MINT);
    expect(REWARD_TOKEN.devnet.decimals).toBe(6);
  });

  test("mainnet reward token is SKR", () => {
    expect(REWARD_TOKEN.mainnet.symbol).toBe("SKR");
    expect(REWARD_TOKEN.mainnet.mint).toBe(SKR_TOKEN.MINT_MAINNET);
    expect(REWARD_TOKEN.mainnet.decimals).toBe(6);
  });
});

describe("Reward Addresses", () => {
  test("devnet has rewardMint matching SUDIGITAL", () => {
    expect(DEVNET_ADDRESSES.rewardMint).toBe(SUDIGITAL_TOKEN.MINT);
  });

  test("mainnet has rewardMint matching SKR", () => {
    expect(MAINNET_ADDRESSES.rewardMint).toBe(SKR_TOKEN.MINT_MAINNET);
  });

  test("getAddresses returns devnet addresses", () => {
    const addresses = getAddresses("devnet");
    expect(addresses.rewardMint).toBe(SUDIGITAL_TOKEN.MINT);
    expect(addresses.sudigitalMint).toBe(SUDIGITAL_TOKEN.MINT);
  });

  test("getAddresses returns mainnet addresses", () => {
    const addresses = getAddresses("mainnet");
    expect(addresses.rewardMint).toBe(SKR_TOKEN.MINT_MAINNET);
  });
});

describe("Gamification Rewards", () => {
  test("conversation reward amounts", () => {
    expect(GAMIFICATION_REWARDS.CONVERSATION_REWARD).toBe(0.5);
    expect(GAMIFICATION_REWARDS.PAID_CONVERSATION_REWARD).toBe(2);
  });

  test("daily check-in reward", () => {
    expect(GAMIFICATION_REWARDS.DAILY_CHECK_IN).toBe(0.1);
  });

  test("streak bonuses", () => {
    expect(GAMIFICATION_REWARDS.STREAK_7_DAYS).toBe(1);
    expect(GAMIFICATION_REWARDS.STREAK_30_DAYS).toBe(5);
    expect(GAMIFICATION_REWARDS.STREAK_100_DAYS).toBe(20);
  });
});
