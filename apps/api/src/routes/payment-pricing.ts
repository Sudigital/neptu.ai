import { PRICING, type ReadingType } from "@neptu/shared";
import {
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
  calculateSudigitalPayment,
  getReadingPrice,
} from "@neptu/solana";
import { Hono } from "hono";

export const paymentPricingRoutes = new Hono();

// GET /pricing - Get all pricing information
paymentPricingRoutes.get("/", (c) => {
  const pricing = Object.entries(PRICING).map(([type, prices]) => {
    const readingType = type as ReadingType;
    const reward = calculateSolPaymentReward(readingType);
    const burn = calculateNeptuPaymentBurn(readingType);
    const sudigital = calculateSudigitalPayment(readingType);

    return {
      readingType,
      sol: {
        price: prices.SOL,
        neptuReward: reward.neptuRewardFormatted,
      },
      neptu: {
        price: prices.NEPTU,
        burned: burn.burnAmountFormatted,
        toEcosystem: burn.treasuryAmountFormatted,
      },
      sudigital: {
        price: prices.SUDIGITAL,
        neptuReward: sudigital.neptuRewardFormatted,
      },
    };
  });

  return c.json({ success: true, pricing });
});

// GET /pricing/:readingType - Get pricing for specific reading type
paymentPricingRoutes.get("/:readingType", (c) => {
  const readingType = c.req.param("readingType") as ReadingType;

  if (
    !["POTENSI", "PELUANG", "AI_CHAT", "COMPATIBILITY"].includes(readingType)
  ) {
    return c.json({ success: false, error: "Invalid reading type" }, 400);
  }

  const solPrice = getReadingPrice(readingType, "sol");
  const neptuPrice = getReadingPrice(readingType, "neptu");
  const sudigitalPrice = getReadingPrice(readingType, "sudigital");
  const reward = calculateSolPaymentReward(readingType);
  const burn = calculateNeptuPaymentBurn(readingType);
  const sudigitalPayment = calculateSudigitalPayment(readingType);

  return c.json({
    success: true,
    readingType,
    pricing: {
      sol: {
        amount: solPrice,
        neptuReward: reward.neptuRewardFormatted,
      },
      neptu: {
        amount: neptuPrice,
        burned: burn.burnAmountFormatted,
        toEcosystem: burn.treasuryAmountFormatted,
      },
      sudigital: {
        amount: sudigitalPrice,
        neptuReward: sudigitalPayment.neptuRewardFormatted,
      },
    },
  });
});
