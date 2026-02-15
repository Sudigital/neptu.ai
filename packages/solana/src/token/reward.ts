import { NEPTU_TOKEN, PRICING, type ReadingType } from "@neptu/shared";

import { neptuToRaw, solToLamports, sudigitalToRaw } from "../constants";

export interface RewardCalculation {
  solAmount: bigint;
  neptuReward: bigint;
  neptuRewardFormatted: number;
}

export interface BurnCalculation {
  neptuAmount: bigint;
  burnAmount: bigint;
  treasuryAmount: bigint;
  burnAmountFormatted: number;
  treasuryAmountFormatted: number;
}

export interface SudigitalPaymentCalculation {
  sudigitalAmount: bigint;
  sudigitalAmountFormatted: number;
  neptuReward: bigint;
  neptuRewardFormatted: number;
}

export function calculateSolPaymentReward(
  readingType: ReadingType
): RewardCalculation {
  const pricing = PRICING[readingType];
  const solAmount = solToLamports(pricing.SOL);
  const neptuReward = neptuToRaw(pricing.NEPTU_REWARD);

  return {
    solAmount,
    neptuReward,
    neptuRewardFormatted: pricing.NEPTU_REWARD,
  };
}

export function calculateNeptuPaymentBurn(
  readingType: ReadingType
): BurnCalculation {
  const pricing = PRICING[readingType];
  const neptuAmount = neptuToRaw(pricing.NEPTU);
  const burnRate = NEPTU_TOKEN.BURN_RATE;

  const burnAmount = BigInt(Math.floor(Number(neptuAmount) * burnRate));
  const treasuryAmount = neptuAmount - burnAmount;

  return {
    neptuAmount,
    burnAmount,
    treasuryAmount,
    burnAmountFormatted: pricing.NEPTU * burnRate,
    treasuryAmountFormatted: pricing.NEPTU * (1 - burnRate),
  };
}

export function calculateSudigitalPayment(
  readingType: ReadingType
): SudigitalPaymentCalculation {
  const pricing = PRICING[readingType];
  const sudigitalAmount = sudigitalToRaw(pricing.SUDIGITAL);
  const neptuReward = neptuToRaw(pricing.SUDIGITAL_NEPTU_REWARD);

  return {
    sudigitalAmount,
    sudigitalAmountFormatted: pricing.SUDIGITAL,
    neptuReward,
    neptuRewardFormatted: pricing.SUDIGITAL_NEPTU_REWARD,
  };
}

export function getReadingPrice(
  readingType: ReadingType,
  paymentType: "sol" | "neptu" | "sudigital"
): number {
  const pricing = PRICING[readingType];
  switch (paymentType) {
    case "sol":
      return pricing.SOL;
    case "neptu":
      return pricing.NEPTU;
    case "sudigital":
      return pricing.SUDIGITAL;
  }
}
