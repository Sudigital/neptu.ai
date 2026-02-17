import { zValidator } from "@hono/zod-validator";
import {
  ApiSubscriptionService,
  ApiPricingPlanService,
  ApiCreditPackService,
  type Database,
} from "@neptu/drizzle-orm";
import { DEFAULT_NETWORK } from "@neptu/shared";
import {
  createSolanaClient,
  createNeptuPrograms,
  deriveAssociatedTokenAddress,
  buildPayWithSolInstruction,
  buildPayWithNeptuInstruction,
  getLatestBlockhash,
  verifyTransaction,
  address,
  type NeptuPrograms,
} from "@neptu/solana";
import { Hono } from "hono";
import { z } from "zod";

import { type AuthEnv } from "../middleware/paseto-auth";

type Env = AuthEnv & {
  Variables: AuthEnv["Variables"] & {
    db: Database;
  };
  Bindings: {
    SOLANA_NETWORK?: string;
    SOLANA_RPC_URL?: string;
    NEPTU_TREASURY?: string;
  };
};

export const apiSubscriptionPaymentRoutes = new Hono<Env>();

const getSolanaClient = (env?: Env["Bindings"]) => {
  const network =
    (env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
  return createSolanaClient(network, env?.SOLANA_RPC_URL);
};

const getTreasuryAddress = (env?: Env["Bindings"]) => env?.NEPTU_TREASURY || "";

const programsCache: Map<string, NeptuPrograms> = new Map();

async function getPrograms(
  network: "devnet" | "mainnet"
): Promise<NeptuPrograms> {
  if (!programsCache.has(network)) {
    programsCache.set(network, await createNeptuPrograms(network));
  }
  return programsCache.get(network)!;
}

const subscribeSchema = z.object({
  planSlug: z.string().min(1),
  paymentMethod: z.enum(["sol", "neptu", "sudigital"]),
  blockhash: z.string().optional(),
  lastValidBlockHeight: z.number().optional(),
});

const verifySubscriptionSchema = z.object({
  planSlug: z.string().min(1),
  paymentMethod: z.enum(["sol", "neptu", "sudigital"]),
  txSignature: z.string().min(64).max(128),
});

const purchaseCreditsSchema = z.object({
  packSlug: z.string().min(1),
  paymentMethod: z.enum(["sol", "neptu", "sudigital"]),
  blockhash: z.string().optional(),
  lastValidBlockHeight: z.number().optional(),
});

const verifyCreditsSchema = z.object({
  packSlug: z.string().min(1),
  paymentMethod: z.enum(["sol", "neptu", "sudigital"]),
  txSignature: z.string().min(64).max(128),
});

apiSubscriptionPaymentRoutes.post(
  "/subscribe/build",
  zValidator("json", subscribeSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const walletAddress = c.get("walletAddress") as string;
    const {
      planSlug,
      paymentMethod,
      blockhash: clientBlockhash,
      lastValidBlockHeight: clientBlockHeight,
    } = c.req.valid("json");

    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    const pricingService = new ApiPricingPlanService(db);
    const plan = await pricingService.getPlanBySlug(planSlug);

    if (!plan) {
      return c.json({ success: false, error: "Plan not found" }, 404);
    }

    if (!plan.isActive) {
      return c.json({ success: false, error: "Plan is not available" }, 400);
    }

    const treasuryAddr = getTreasuryAddress(c.env);
    if (!treasuryAddr) {
      return c.json(
        { success: false, error: "Treasury address not configured" },
        500
      );
    }

    const programs = await getPrograms(network);
    const userAddress = address(walletAddress);
    const treasuryAddress = address(treasuryAddr);

    let amount: number;
    let instruction;

    if (paymentMethod === "sol") {
      amount = plan.priceSol ?? 0;
      if (amount <= 0) {
        return c.json(
          { success: false, error: "SOL payment not available for this plan" },
          400
        );
      }

      const userNeptuAccount = await deriveAssociatedTokenAddress(
        userAddress,
        programs.mintPda
      );

      instruction = buildPayWithSolInstruction(
        programs,
        userAddress,
        treasuryAddress,
        userNeptuAccount,
        "POTENSI"
      );
    } else if (paymentMethod === "neptu") {
      amount = plan.priceNeptu ?? 0;
      if (amount <= 0) {
        return c.json(
          {
            success: false,
            error: "NEPTU payment not available for this plan",
          },
          400
        );
      }

      const userNeptuAccount = await deriveAssociatedTokenAddress(
        userAddress,
        programs.mintPda
      );

      instruction = buildPayWithNeptuInstruction(
        programs,
        userAddress,
        treasuryAddress,
        userNeptuAccount,
        "POTENSI"
      );
    } else {
      return c.json(
        { success: false, error: "Payment method not supported yet" },
        400
      );
    }

    const { blockhash, lastValidBlockHeight } =
      clientBlockhash && clientBlockHeight != null
        ? {
            blockhash: clientBlockhash,
            lastValidBlockHeight: BigInt(clientBlockHeight),
          }
        : await getLatestBlockhash(solanaClient.rpc, network);

    return c.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        tier: plan.tier,
      },
      payment: {
        method: paymentMethod,
        amount,
        currency: paymentMethod.toUpperCase(),
      },
      instruction: {
        programId: instruction.programAddress,
        accounts: instruction.accounts,
        data: Array.from(instruction.data as Uint8Array),
      },
      transaction: {
        blockhash,
        lastValidBlockHeight: Number(lastValidBlockHeight),
      },
    });
  }
);

apiSubscriptionPaymentRoutes.post(
  "/subscribe/verify",
  zValidator("json", verifySubscriptionSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const { planSlug, paymentMethod, txSignature } = c.req.valid("json");

    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    const pricingService = new ApiPricingPlanService(db);
    const plan = await pricingService.getPlanBySlug(planSlug);

    if (!plan) {
      return c.json({ success: false, error: "Plan not found" }, 404);
    }

    const verification = await verifyTransaction(
      solanaClient.rpc,
      txSignature,
      network
    );

    if (!verification.isValid) {
      return c.json(
        { success: false, error: "Transaction not confirmed" },
        400
      );
    }

    const subscriptionService = new ApiSubscriptionService(db);

    const existingSub = await subscriptionService.getActiveSubscription(userId);
    if (existingSub) {
      await subscriptionService.cancelSubscription(existingSub.id, userId);
    }

    const subscription = await subscriptionService.createSubscription(userId, {
      planId: plan.id,
      paymentMethod,
      paymentTxSignature: txSignature,
    });

    return c.json({
      success: true,
      subscription,
      message: `Successfully subscribed to ${plan.name} plan`,
    });
  }
);

apiSubscriptionPaymentRoutes.post(
  "/credits/build",
  zValidator("json", purchaseCreditsSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const walletAddress = c.get("walletAddress") as string;
    const {
      packSlug,
      paymentMethod,
      blockhash: clientBlockhash,
      lastValidBlockHeight: clientBlockHeight,
    } = c.req.valid("json");

    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    const creditPackService = new ApiCreditPackService(db);
    const pack = await creditPackService.getPackBySlug(packSlug);

    if (!pack) {
      return c.json({ success: false, error: "Credit pack not found" }, 404);
    }

    if (!pack.isActive) {
      return c.json(
        { success: false, error: "Credit pack is not available" },
        400
      );
    }

    const treasuryAddr = getTreasuryAddress(c.env);
    if (!treasuryAddr) {
      return c.json(
        { success: false, error: "Treasury address not configured" },
        500
      );
    }

    const programs = await getPrograms(network);
    const userAddress = address(walletAddress);
    const treasuryAddress = address(treasuryAddr);

    let amount: number;
    let instruction;

    if (paymentMethod === "sol") {
      amount = pack.priceSol ?? 0;
      if (amount <= 0) {
        return c.json(
          { success: false, error: "SOL payment not available for this pack" },
          400
        );
      }

      const userNeptuAccount = await deriveAssociatedTokenAddress(
        userAddress,
        programs.mintPda
      );

      instruction = buildPayWithSolInstruction(
        programs,
        userAddress,
        treasuryAddress,
        userNeptuAccount,
        "POTENSI"
      );
    } else if (paymentMethod === "neptu") {
      amount = pack.priceNeptu ?? 0;
      if (amount <= 0) {
        return c.json(
          {
            success: false,
            error: "NEPTU payment not available for this pack",
          },
          400
        );
      }

      const userNeptuAccount = await deriveAssociatedTokenAddress(
        userAddress,
        programs.mintPda
      );

      instruction = buildPayWithNeptuInstruction(
        programs,
        userAddress,
        treasuryAddress,
        userNeptuAccount,
        "POTENSI"
      );
    } else {
      return c.json(
        { success: false, error: "Payment method not supported yet" },
        400
      );
    }

    const { blockhash, lastValidBlockHeight } =
      clientBlockhash && clientBlockHeight != null
        ? {
            blockhash: clientBlockhash,
            lastValidBlockHeight: BigInt(clientBlockHeight),
          }
        : await getLatestBlockhash(solanaClient.rpc, network);

    return c.json({
      success: true,
      pack: {
        id: pack.id,
        name: pack.name,
        slug: pack.slug,
        credits: pack.credits,
        aiCredits: pack.aiCredits,
      },
      payment: {
        method: paymentMethod,
        amount,
        currency: paymentMethod.toUpperCase(),
      },
      instruction: {
        programId: instruction.programAddress,
        accounts: instruction.accounts,
        data: Array.from(instruction.data as Uint8Array),
      },
      transaction: {
        blockhash,
        lastValidBlockHeight: Number(lastValidBlockHeight),
      },
    });
  }
);

apiSubscriptionPaymentRoutes.post(
  "/credits/verify",
  zValidator("json", verifyCreditsSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const userId = c.get("userId") as string;
    const {
      packSlug,
      paymentMethod: _paymentMethod,
      txSignature,
    } = c.req.valid("json");

    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    const creditPackService = new ApiCreditPackService(db);
    const pack = await creditPackService.getPackBySlug(packSlug);

    if (!pack) {
      return c.json({ success: false, error: "Credit pack not found" }, 404);
    }

    const verification = await verifyTransaction(
      solanaClient.rpc,
      txSignature,
      network
    );

    if (!verification.isValid) {
      return c.json(
        { success: false, error: "Transaction not confirmed" },
        400
      );
    }

    const subscriptionService = new ApiSubscriptionService(db);
    const subscription =
      await subscriptionService.getActiveSubscription(userId);

    if (!subscription) {
      return c.json(
        {
          success: false,
          error: "No active subscription found. Please subscribe first.",
        },
        400
      );
    }

    const bonusMultiplier = 1 + pack.bonusPercent / 100;
    const totalCredits = Math.floor(pack.credits * bonusMultiplier);
    const totalAiCredits = Math.floor(pack.aiCredits * bonusMultiplier);

    const updatedSubscription = await subscriptionService.addCredits(
      subscription.id,
      totalCredits,
      totalAiCredits
    );

    return c.json({
      success: true,
      subscription: updatedSubscription,
      creditsAdded: {
        basic: totalCredits,
        ai: totalAiCredits,
        bonusPercent: pack.bonusPercent,
      },
      message: `Successfully added ${totalCredits} basic credits and ${totalAiCredits} AI credits`,
    });
  }
);
