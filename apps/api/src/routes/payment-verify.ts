import { zValidator } from "@hono/zod-validator";
import {
  TokenTransactionService,
  UserService,
  type Database,
} from "@neptu/drizzle-orm";
import { DEFAULT_NETWORK, PRICING, type ReadingType } from "@neptu/shared";
import {
  createSolanaClient,
  verifyTransaction,
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
  calculateSudigitalPayment,
} from "@neptu/solana";
import { Hono } from "hono";
import { z } from "zod";

import { type AuthEnv } from "../middleware/paseto-auth";

type Env = {
  Variables: { db: Database } & AuthEnv["Variables"];
  Bindings: {
    SOLANA_NETWORK?: string;
    SOLANA_RPC_URL?: string;
  };
};

const readingTypeEnum = z.enum([
  "POTENSI",
  "PELUANG",
  "AI_CHAT",
  "COMPATIBILITY",
]);

const verifyPaymentSchema = z.object({
  txSignature: z.string().min(64).max(128),
  walletAddress: z.string().min(32).max(64),
  readingType: readingTypeEnum,
  paymentType: z.enum(["sol", "neptu", "sudigital"]),
});

export const paymentVerifyRoutes = new Hono<Env>();

paymentVerifyRoutes.post(
  "/",
  zValidator("json", verifyPaymentSchema),
  async (c) => {
    const { txSignature, walletAddress, readingType, paymentType } =
      c.req.valid("json");
    const db = c.get("db");
    const userService = new UserService(db);
    const tokenService = new TokenTransactionService(db);
    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = createSolanaClient(network, c.env?.SOLANA_RPC_URL);

    try {
      const existingTx =
        await tokenService.getTransactionBySignature(txSignature);
      if (existingTx) {
        return c.json({
          success: true,
          transaction: existingTx,
          message: "Transaction already recorded",
        });
      }

      const user = await userService.getOrCreateUser(walletAddress);

      const verification = await verifyTransaction(
        solanaClient.rpc,
        txSignature,
        network
      );

      if (!verification.isValid) {
        return c.json(
          {
            success: false,
            error: verification.error || "Invalid transaction",
          },
          400
        );
      }

      let transactionType:
        | "sol_payment"
        | "neptu_payment"
        | "sudigital_payment";
      let neptuRewarded: number | undefined;
      let neptuBurned: number | undefined;
      let solAmount: number | undefined;
      let neptuAmount: number | undefined;
      let sudigitalAmount: number | undefined;

      const pricing = PRICING[readingType as keyof typeof PRICING];

      if (paymentType === "sol") {
        transactionType = "sol_payment";
        const reward = calculateSolPaymentReward(readingType as ReadingType);
        solAmount = pricing.SOL;
        neptuRewarded = reward.neptuRewardFormatted;
      } else if (paymentType === "sudigital") {
        transactionType = "sudigital_payment";
        const payment = calculateSudigitalPayment(readingType as ReadingType);
        sudigitalAmount = payment.sudigitalAmountFormatted;
        neptuRewarded = payment.neptuRewardFormatted;
      } else {
        transactionType = "neptu_payment";
        const burn = calculateNeptuPaymentBurn(readingType as ReadingType);
        neptuAmount = pricing.NEPTU;
        neptuBurned = burn.burnAmountFormatted;
      }

      const _transaction = await tokenService.createTransaction({
        userId: user.id,
        txSignature,
        transactionType,
        readingType: readingType as ReadingType,
        solAmount,
        neptuAmount,
        sudigitalAmount,
        neptuBurned,
        neptuRewarded,
      });

      const confirmedTx = await tokenService.confirmTransaction({
        txSignature,
        status: "confirmed",
        confirmedAt: new Date().toISOString(),
      });

      return c.json({
        success: true,
        transaction: confirmedTx,
        reward: neptuRewarded
          ? { neptuRewarded, message: `Earned ${neptuRewarded} NEPTU` }
          : undefined,
        burn: neptuBurned
          ? { neptuBurned, message: `Burned ${neptuBurned} NEPTU` }
          : undefined,
        sudigital: sudigitalAmount
          ? {
              sudigitalAmount,
              neptuRewarded: neptuRewarded,
              message: `Paid ${sudigitalAmount} SUDIGITAL, earned ${neptuRewarded} NEPTU`,
            }
          : undefined,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to verify payment",
        },
        500
      );
    }
  }
);
