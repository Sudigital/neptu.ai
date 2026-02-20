import { zValidator } from "@hono/zod-validator";
import { type Database } from "@neptu/drizzle-orm";
import {
  DEFAULT_NETWORK,
  PRICING,
  SUDIGITAL_TOKEN,
  type ReadingType,
} from "@neptu/shared";
import {
  createSolanaClient,
  createNeptuPrograms,
  deriveAssociatedTokenAddress,
  buildPayWithSolInstruction,
  buildPayWithNeptuInstruction,
  getLatestBlockhash,
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
  calculateSudigitalPayment,
  address,
  type NeptuPrograms,
} from "@neptu/solana";
import { Hono } from "hono";
import { z } from "zod";

import {
  dynamicJwtAuth,
  type DynamicJwtAuthEnv,
} from "../../middleware/dynamic-jwt-auth";

type Env = {
  Variables: { db: Database } & DynamicJwtAuthEnv["Variables"];
  Bindings: {
    SOLANA_NETWORK?: string;
    SOLANA_RPC_URL?: string;
    NEPTU_TREASURY?: string;
    NEPTU_ECOSYSTEM_POOL?: string;
    SUDIGITAL_TREASURY?: string;
  };
};

export const paymentRoutes = new Hono<Env>();

// All payment routes require Dynamic JWT authentication
paymentRoutes.use("/*", dynamicJwtAuth);

// Solana client will be created per-request with env access
const getSolanaClient = (env?: Env["Bindings"]) => {
  const network =
    (env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
  return createSolanaClient(network, env?.SOLANA_RPC_URL);
};

// Get addresses from env bindings
const getTreasuryAddress = (env?: Env["Bindings"]) => env?.NEPTU_TREASURY || "";
const getEcosystemPoolAddress = (env?: Env["Bindings"]) =>
  env?.NEPTU_ECOSYSTEM_POOL || "";
const getSudigitalTreasuryAddress = (env?: Env["Bindings"]) =>
  env?.SUDIGITAL_TREASURY || "";

// Cache programs context per network
const programsCache: Map<string, NeptuPrograms> = new Map();

async function getPrograms(
  network: "devnet" | "mainnet"
): Promise<NeptuPrograms> {
  if (!programsCache.has(network)) {
    programsCache.set(network, await createNeptuPrograms(network));
  }
  return programsCache.get(network)!;
}

// Validation schemas
const readingTypeEnum = z.enum([
  "POTENSI",
  "PELUANG",
  "AI_CHAT",
  "COMPATIBILITY",
]);

const buildPaySchema = z.object({
  walletAddress: z.string().min(32).max(64),
  readingType: readingTypeEnum,
  blockhash: z.string().optional(),
  lastValidBlockHeight: z.number().optional(),
});

// GET /pay/sol/build - Get instruction data for SOL payment
paymentRoutes.post(
  "/sol/build",
  zValidator("json", buildPaySchema),
  async (c) => {
    const {
      walletAddress,
      readingType,
      blockhash: clientBlockhash,
      lastValidBlockHeight: clientBlockHeight,
    } = c.req.valid("json");
    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    try {
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

      const userNeptuAccount = await deriveAssociatedTokenAddress(
        userAddress,
        programs.mintPda
      );

      const instruction = buildPayWithSolInstruction(
        programs,
        userAddress,
        treasuryAddress,
        userNeptuAccount,
        readingType as ReadingType
      );

      // Use client-provided blockhash if available, otherwise fetch from RPC
      const { blockhash, lastValidBlockHeight } =
        clientBlockhash &&
        clientBlockHeight !== null &&
        clientBlockHeight !== undefined
          ? {
              blockhash: clientBlockhash,
              lastValidBlockHeight: BigInt(clientBlockHeight),
            }
          : await getLatestBlockhash(solanaClient.rpc, network);

      const pricing = PRICING[readingType as keyof typeof PRICING];
      const reward = calculateSolPaymentReward(readingType as ReadingType);

      return c.json({
        success: true,
        instruction: {
          programId: instruction.programAddress,
          accounts: instruction.accounts,
          data: Array.from(instruction.data as Uint8Array),
        },
        transaction: {
          blockhash,
          lastValidBlockHeight: Number(lastValidBlockHeight),
        },
        pricing: {
          solAmount: pricing.SOL,
          neptuReward: reward.neptuRewardFormatted,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to build SOL payment",
        },
        500
      );
    }
  }
);

// POST /pay/neptu/build - Get instruction data for NEPTU payment
paymentRoutes.post(
  "/neptu/build",
  zValidator("json", buildPaySchema),
  async (c) => {
    const {
      walletAddress,
      readingType,
      blockhash: clientBlockhash,
      lastValidBlockHeight: clientBlockHeight,
    } = c.req.valid("json");
    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    try {
      const ecosystemPoolAddr = getEcosystemPoolAddress(c.env);
      if (!ecosystemPoolAddr) {
        return c.json(
          { success: false, error: "Ecosystem pool address not configured" },
          500
        );
      }

      const programs = await getPrograms(network);
      const userAddress = address(walletAddress);
      const ecosystemPoolAddress = address(ecosystemPoolAddr);

      const userNeptuAccount = await deriveAssociatedTokenAddress(
        userAddress,
        programs.mintPda
      );

      const instruction = buildPayWithNeptuInstruction(
        programs,
        userAddress,
        userNeptuAccount,
        ecosystemPoolAddress,
        readingType as ReadingType
      );

      // Use client-provided blockhash if available, otherwise fetch from RPC
      const { blockhash, lastValidBlockHeight } =
        clientBlockhash &&
        clientBlockHeight !== null &&
        clientBlockHeight !== undefined
          ? {
              blockhash: clientBlockhash,
              lastValidBlockHeight: BigInt(clientBlockHeight),
            }
          : await getLatestBlockhash(solanaClient.rpc, network);

      const pricing = PRICING[readingType as keyof typeof PRICING];
      const burn = calculateNeptuPaymentBurn(readingType as ReadingType);

      return c.json({
        success: true,
        instruction: {
          programId: instruction.programAddress,
          accounts: instruction.accounts,
          data: Array.from(instruction.data as Uint8Array),
        },
        transaction: {
          blockhash,
          lastValidBlockHeight: Number(lastValidBlockHeight),
        },
        pricing: {
          neptuAmount: pricing.NEPTU,
          neptuBurned: burn.burnAmountFormatted,
          neptuToEcosystem: burn.treasuryAmountFormatted,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to build NEPTU payment",
        },
        500
      );
    }
  }
);

// POST /pay/sudigital/build - Build SUDIGITAL SPL token transfer to treasury
paymentRoutes.post(
  "/sudigital/build",
  zValidator("json", buildPaySchema),
  async (c) => {
    const {
      walletAddress,
      readingType,
      blockhash: clientBlockhash,
      lastValidBlockHeight: clientBlockHeight,
    } = c.req.valid("json");
    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    try {
      const sudigitalTreasuryAddr = getSudigitalTreasuryAddress(c.env);
      if (!sudigitalTreasuryAddr) {
        return c.json(
          {
            success: false,
            error: "SUDIGITAL treasury address not configured",
          },
          500
        );
      }

      const { blockhash, lastValidBlockHeight } =
        clientBlockhash &&
        clientBlockHeight !== null &&
        clientBlockHeight !== undefined
          ? {
              blockhash: clientBlockhash,
              lastValidBlockHeight: BigInt(clientBlockHeight),
            }
          : await getLatestBlockhash(solanaClient.rpc, network);

      const pricing = PRICING[readingType as keyof typeof PRICING];
      const payment = calculateSudigitalPayment(readingType as ReadingType);

      // Return transfer details for client-side SPL token transfer
      return c.json({
        success: true,
        transfer: {
          mint: SUDIGITAL_TOKEN.MINT,
          from: walletAddress,
          to: sudigitalTreasuryAddr,
          amount: Number(payment.sudigitalAmount),
          decimals: SUDIGITAL_TOKEN.DECIMALS,
        },
        transaction: {
          blockhash,
          lastValidBlockHeight: Number(lastValidBlockHeight),
        },
        pricing: {
          sudigitalAmount: pricing.SUDIGITAL,
          neptuReward: payment.neptuRewardFormatted,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to build SUDIGITAL payment",
        },
        500
      );
    }
  }
);

// POST /pay/verify - Extracted to payment-verify.ts
import { paymentVerifyRoutes } from "./payment-verify";

paymentRoutes.route("/verify", paymentVerifyRoutes);

// POST /claim - Extracted to payment-claim.ts
import { paymentClaimRoutes } from "./payment-claim";

paymentRoutes.route("/claim", paymentClaimRoutes);

// Pricing routes (extracted to payment-pricing.ts)
import { paymentPricingRoutes } from "./payment-pricing";
paymentRoutes.route("/pricing", paymentPricingRoutes);
