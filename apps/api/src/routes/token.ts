import { zValidator } from "@hono/zod-validator";
import {
  TokenTransactionService,
  UserService,
  UserRewardService,
  type Database,
} from "@neptu/drizzle-orm";
import { DEFAULT_NETWORK, type ReadingType } from "@neptu/shared";
import {
  createSolanaClient,
  verifyTransaction,
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
  getReadingPrice,
} from "@neptu/solana";
import { Hono } from "hono";
import { z } from "zod";

import { type AuthEnv } from "../middleware/paseto-auth";

type Env = {
  Variables: { db: Database } & AuthEnv["Variables"];
  Bindings: { SOLANA_NETWORK?: string; SOLANA_RPC_URL?: string };
};

export const tokenRoutes = new Hono<Env>();

// Solana client will be created per-request with env access
const getSolanaClient = (env?: Env["Bindings"]) => {
  const network =
    (env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
  return createSolanaClient(network, env?.SOLANA_RPC_URL);
};

const verifyPaymentSchema = z.object({
  txSignature: z.string().min(64).max(128),
  walletAddress: z.string().min(32).max(64),
  readingType: z.enum(["POTENSI", "PELUANG", "AI_CHAT", "COMPATIBILITY"]),
  paymentType: z.enum(["sol", "neptu"]),
});

const getTransactionsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  transactionType: z
    .enum(["sol_payment", "neptu_payment", "neptu_reward", "neptu_burn"])
    .optional(),
});

tokenRoutes.post(
  "/verify-payment",
  zValidator("json", verifyPaymentSchema),
  async (c) => {
    const { txSignature, walletAddress, readingType, paymentType } =
      c.req.valid("json");
    const db = c.get("db");
    const userService = new UserService(db);
    const tokenService = new TokenTransactionService(db);

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
      const solanaClient = getSolanaClient(c.env);
      const network =
        (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
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

      const transactionType =
        paymentType === "sol" ? "sol_payment" : "neptu_payment";
      let neptuRewarded: number | undefined;
      let neptuBurned: number | undefined;
      let solAmount: number | undefined;
      let neptuAmount: number | undefined;

      if (paymentType === "sol") {
        const reward = calculateSolPaymentReward(readingType as ReadingType);
        solAmount = verification.amountFormatted;
        neptuRewarded = reward.neptuRewardFormatted;
      } else {
        const burn = calculateNeptuPaymentBurn(readingType as ReadingType);
        neptuAmount = verification.amountFormatted;
        neptuBurned = burn.burnAmountFormatted;
      }

      const _transaction = await tokenService.createTransaction({
        userId: user.id,
        txSignature,
        transactionType,
        readingType: readingType as
          | "POTENSI"
          | "PELUANG"
          | "AI_CHAT"
          | "COMPATIBILITY",
        solAmount,
        neptuAmount,
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

tokenRoutes.get(
  "/transactions/:walletAddress",
  zValidator("query", getTransactionsSchema),
  async (c) => {
    const walletAddress = c.req.param("walletAddress");
    const { limit = 20, offset, transactionType } = c.req.valid("query");
    const db = c.get("db");
    const userService = new UserService(db);
    const tokenService = new TokenTransactionService(db);
    const rewardService = new UserRewardService(db);

    try {
      const user = await userService.getUserByWallet(walletAddress);
      if (!user) {
        return c.json({ success: false, error: "User not found" }, 404);
      }

      // Fetch token_transactions
      const transactions = await tokenService.getTransactionsByUser({
        userId: user.id,
        transactionType,
        limit,
        offset,
      });

      // Also fetch user_rewards to show as reward entries in history
      // Only include if not filtering by a specific non-reward type
      let rewardEntries: Array<{
        id: string;
        transactionType: string;
        neptuAmount: number;
        status: string;
        createdAt: string;
        description: string;
        txSignature: string | null;
      }> = [];

      if (!transactionType || transactionType === "neptu_reward") {
        const allRewards = await rewardService.getRewardsByUser({
          userId: user.id,
          limit: limit,
        });

        rewardEntries = allRewards.map((r) => ({
          id: r.id,
          transactionType: "neptu_reward" as const,
          neptuAmount: Number(r.neptuAmount),
          status: r.status === "claimed" ? "confirmed" : "pending",
          createdAt: r.createdAt,
          description: r.description || r.rewardType,
          txSignature: r.claimTxSignature || null,
        }));
      }

      // Merge and sort by date (newest first), take up to limit
      const combined = [
        ...transactions.map((t) => ({
          ...t,
          source: "transaction" as const,
        })),
        ...rewardEntries.map((r) => ({
          ...r,
          source: "reward" as const,
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);

      return c.json({ success: true, transactions: combined });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get transactions",
        },
        500
      );
    }
  }
);

tokenRoutes.get("/stats/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const db = c.get("db");
  const userService = new UserService(db);
  const tokenService = new TokenTransactionService(db);
  const rewardService = new UserRewardService(db);

  try {
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    // Get both token_transactions stats and user_rewards stats
    const [txStats, pendingRewards, claimedRewards] = await Promise.all([
      tokenService.getUserTokenStats(user.id),
      rewardService.getTotalPendingAmount(user.id),
      rewardService.getClaimedRewards(user.id),
    ]);

    const claimedTotal = claimedRewards.reduce(
      (sum, r) => sum + Number(r.neptuAmount ?? 0),
      0
    );

    // Combine: tx-level stats + reward-level stats
    const stats = {
      totalNeptuRewarded:
        Number(txStats.totalNeptuRewarded) +
        Number(pendingRewards) +
        claimedTotal,
      totalNeptuBurned: txStats.totalNeptuBurned,
      totalSolSpent: txStats.totalSolSpent,
      transactionCount: txStats.transactionCount,
      pendingRewards,
      claimedRewards: claimedTotal,
    };

    return c.json({ success: true, stats });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get stats",
      },
      500
    );
  }
});

tokenRoutes.get("/price/:readingType", (c) => {
  const readingType = c.req.param("readingType") as ReadingType;

  if (
    !["POTENSI", "PELUANG", "AI_CHAT", "COMPATIBILITY"].includes(readingType)
  ) {
    return c.json({ success: false, error: "Invalid reading type" }, 400);
  }

  const solPrice = getReadingPrice(readingType, "sol");
  const neptuPrice = getReadingPrice(readingType, "neptu");
  const reward = calculateSolPaymentReward(readingType);
  const burn = calculateNeptuPaymentBurn(readingType);

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
        toTreasury: burn.treasuryAmountFormatted,
      },
    },
  });
});
