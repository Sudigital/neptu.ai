import { describe, expect, test } from "bun:test";

import { PRICING, NEPTU_TOKEN, SOL_TOKEN } from "@neptu/shared";

import {
  solToLamports,
  lamportsToSol,
  neptuToRaw,
  rawToNeptu,
  LAMPORTS_PER_SOL,
  TOKEN_DECIMALS_MULTIPLIER,
} from "../src/constants";
import {
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
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
});
