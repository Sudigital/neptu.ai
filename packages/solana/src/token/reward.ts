import { NEPTU_TOKEN, PRICING, type ReadingType } from "@neptu/shared";
import { neptuToRaw, solToLamports } from "../constants";

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

export function calculateSolPaymentReward(
  readingType: ReadingType,
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
  readingType: ReadingType,
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

export function getReadingPrice(
  readingType: ReadingType,
  paymentType: "sol" | "neptu",
): number {
  const pricing = PRICING[readingType];
  return paymentType === "sol" ? pricing.SOL : pricing.NEPTU;
}
