import { zValidator } from "@hono/zod-validator";
import {
  UserService,
  UserRewardService,
  UserStreakService,
  TokenTransactionService,
  type Database,
} from "@neptu/drizzle-orm";
import { DEFAULT_NETWORK } from "@neptu/shared";
import {
  createSolanaClient,
  getBalance,
  getTokenBalance,
  getSudigitalBalance,
  lamportsToSol,
} from "@neptu/solana";
import { Hono } from "hono";
import { z } from "zod";

import {
  dynamicJwtAuth,
  type DynamicJwtAuthEnv,
} from "../../middleware/dynamic-jwt-auth";

type Env = DynamicJwtAuthEnv & {
  Variables: DynamicJwtAuthEnv["Variables"] & {
    db: Database;
  };
  Bindings: { SOLANA_NETWORK?: string; SOLANA_RPC_URL?: string };
};

export const walletRoutes = new Hono<Env>();

// All wallet routes require Dynamic JWT authentication
walletRoutes.use("/*", dynamicJwtAuth);

// Solana client per-request with env access
const getSolanaClient = (env?: Env["Bindings"]) => {
  const network =
    (env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
  return createSolanaClient(network, env?.SOLANA_RPC_URL);
};

const claimRewardSchema = z.object({
  rewardId: z.string().uuid(),
  claimTxSignature: z.string().min(64).max(128),
});

walletRoutes.get("/balance/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const network =
    (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
  const solanaClient = getSolanaClient(c.env);
  const db = c.get("db");
  const userService = new UserService(db);
  const rewardService = new UserRewardService(db);

  try {
    // Fetch on-chain balance and DB rewards in parallel
    const [onChainBalance, user] = await Promise.all([
      getTokenBalance(solanaClient.rpc, walletAddress, network).catch(() => ({
        raw: BigInt(0),
        formatted: 0,
      })),
      userService.getUserByWallet(walletAddress),
    ]);

    // Get pending rewards separately (not combined into on-chain balance)
    let dbPendingBalance = 0;
    if (user) {
      dbPendingBalance = await rewardService.getTotalPendingAmount(user.id);
    }

    // Return on-chain balance only (matches Solana Explorer)
    const onChainFormatted = onChainBalance.formatted;
    const onChainRaw = onChainBalance.raw;

    return c.json({
      success: true,
      balance: {
        raw: onChainRaw.toString(),
        formatted: onChainFormatted,
      },
      pendingRewards: dbPendingBalance,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get balance",
      },
      500
    );
  }
});

walletRoutes.get("/balances/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const network =
    (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
  const solanaClient = getSolanaClient(c.env);
  const db = c.get("db");
  const userService = new UserService(db);
  const rewardService = new UserRewardService(db);

  const [solResult, neptuResult, sudigitalResult, user] =
    await Promise.allSettled([
      getBalance(solanaClient.rpc, walletAddress),
      getTokenBalance(solanaClient.rpc, walletAddress, network),
      getSudigitalBalance(solanaClient.rpc, walletAddress, network),
      userService.getUserByWallet(walletAddress),
    ]);

  const solLamports =
    solResult.status === "fulfilled" ? solResult.value : BigInt(0);
  const neptuBalance =
    neptuResult.status === "fulfilled"
      ? neptuResult.value
      : { raw: BigInt(0), formatted: 0 };
  const sudigitalBalance =
    sudigitalResult.status === "fulfilled"
      ? sudigitalResult.value
      : { raw: BigInt(0), formatted: 0 };

  // Get pending rewards separately (not combined into on-chain balance)
  let dbPendingBalance = 0;
  const resolvedUser = user.status === "fulfilled" ? user.value : null;
  if (resolvedUser) {
    dbPendingBalance = await rewardService.getTotalPendingAmount(
      resolvedUser.id
    );
  }

  return c.json({
    success: true,
    sol: {
      lamports: solLamports.toString(),
      formatted: lamportsToSol(solLamports),
    },
    neptu: {
      raw: neptuBalance.raw.toString(),
      formatted: neptuBalance.formatted,
    },
    sudigital: {
      raw: sudigitalBalance.raw.toString(),
      formatted: sudigitalBalance.formatted,
    },
    pendingRewards: dbPendingBalance,
  });
});

walletRoutes.get("/rewards/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const db = c.get("db");
  const userService = new UserService(db);
  const rewardService = new UserRewardService(db);

  try {
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const pendingRewards = await rewardService.getPendingRewards(user.id);
    const totalPending = await rewardService.getTotalPendingAmount(user.id);

    return c.json({
      success: true,
      rewards: pendingRewards,
      totalPending,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get rewards",
      },
      500
    );
  }
});

walletRoutes.get("/streak/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const db = c.get("db");
  const userService = new UserService(db);
  const streakService = new UserStreakService(db);

  try {
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const streak = await streakService.getStreak(user.id);
    const hasCheckedInToday = streak
      ? streakService.isStreakActive(streak) &&
        streak.lastCheckIn?.split("T")[0] ===
          new Date().toISOString().split("T")[0]
      : false;

    return c.json({
      success: true,
      streak,
      hasCheckedInToday,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get streak",
      },
      500
    );
  }
});

walletRoutes.post("/check-in/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const db = c.get("db");
  const userService = new UserService(db);
  const streakService = new UserStreakService(db);

  try {
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const existingStreak = await streakService.getStreak(user.id);
    const today = new Date().toISOString().split("T")[0];
    const lastCheckInDate = existingStreak?.lastCheckIn?.split("T")[0];

    if (lastCheckInDate === today) {
      return c.json({ success: false, error: "Already checked in today" }, 400);
    }

    const result = await streakService.recordCheckIn({ userId: user.id });

    return c.json({
      success: true,
      streak: result.streak,
      dailyRewardGranted: result.dailyRewardGranted,
      streakBonusGranted: result.streakBonusGranted,
      streakBonusAmount: result.streakBonusAmount,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check in",
      },
      500
    );
  }
});

walletRoutes.post(
  "/claim/:walletAddress",
  zValidator("json", claimRewardSchema),
  async (c) => {
    const walletAddress = c.req.param("walletAddress");
    const { rewardId, claimTxSignature } = c.req.valid("json");
    const db = c.get("db");
    const userService = new UserService(db);
    const rewardService = new UserRewardService(db);

    try {
      const user = await userService.getUserByWallet(walletAddress);
      if (!user) {
        return c.json({ success: false, error: "User not found" }, 404);
      }

      const claimed = await rewardService.claimReward({
        rewardId,
        claimTxSignature,
      });

      if (!claimed) {
        return c.json(
          { success: false, error: "Reward not found or already claimed" },
          400
        );
      }

      // Record the claim as a token transaction for history/stats
      const tokenService = new TokenTransactionService(db);
      try {
        const existingTx =
          await tokenService.getTransactionBySignature(claimTxSignature);
        if (!existingTx) {
          await tokenService.createTransaction({
            userId: user.id,
            txSignature: claimTxSignature,
            transactionType: "neptu_reward",
            neptuRewarded: Number(claimed.neptuAmount),
          });
          await tokenService.confirmTransaction({
            txSignature: claimTxSignature,
            status: "confirmed",
            confirmedAt: new Date().toISOString(),
          });
        }
      } catch {
        // Non-critical: don't fail the claim if tx recording fails
      }

      return c.json({ success: true, reward: claimed });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to claim reward",
        },
        500
      );
    }
  }
);

// Revert claimed rewards that failed on-chain back to pending
walletRoutes.post("/revert-failed-claims/:walletAddress", async (c) => {
  const walletAddress = c.req.param("walletAddress");
  const db = c.get("db");
  const userService = new UserService(db);
  const rewardService = new UserRewardService(db);

  try {
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const claimedRewards = await rewardService.getClaimedRewards(user.id);
    const reverted: string[] = [];

    for (const reward of claimedRewards) {
      // Verify the claim tx actually failed on-chain
      if (reward.claimTxSignature) {
        try {
          const _network =
            (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
          const solanaClient = getSolanaClient(c.env);
          const result = await solanaClient.rpc
            .getSignatureStatuses(
              [
                reward.claimTxSignature as Parameters<
                  typeof solanaClient.rpc.getSignatureStatuses
                >[0][0],
              ],
              { searchTransactionHistory: true }
            )
            .send();
          const status = result.value[0];
          // Only revert if tx failed or doesn't exist
          if (status && !status.err) {
            continue; // Transaction succeeded, don't revert
          }
        } catch {
          // If we can't check, still revert (tx likely doesn't exist)
        }
      }

      const result = await rewardService.revertClaim(reward.id);
      if (result) {
        reverted.push(reward.id);
      }
    }

    return c.json({
      success: true,
      revertedCount: reverted.length,
      revertedIds: reverted,
      totalClaimed: claimedRewards.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to revert claims",
      },
      500
    );
  }
});
