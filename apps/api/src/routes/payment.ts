import { zValidator } from "@hono/zod-validator";
import {
  TokenTransactionService,
  UserService,
  type Database,
} from "@neptu/drizzle-orm";
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
  deriveClaimRecordPda,
  buildPayWithSolInstruction,
  buildPayWithNeptuInstruction,
  buildClaimRewardsInstruction,
  getLatestBlockhash,
  verifyTransaction,
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
  calculateSudigitalPayment,
  address,
  type NeptuPrograms,
} from "@neptu/solana";
import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  compileTransaction,
  getTransactionEncoder,
  blockhash as toBlockhash,
} from "@solana/kit";
import { Hono } from "hono";
import { z } from "zod";

type Env = {
  Variables: { db: Database };
  Bindings: {
    SOLANA_NETWORK?: string;
    SOLANA_RPC_URL?: string;
    NEPTU_TREASURY?: string;
    NEPTU_ECOSYSTEM_POOL?: string;
    SUDIGITAL_TREASURY?: string;
  };
};

export const paymentRoutes = new Hono<Env>();

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

const verifyPaymentSchema = z.object({
  txSignature: z.string().min(64).max(128),
  walletAddress: z.string().min(32).max(64),
  readingType: readingTypeEnum,
  paymentType: z.enum(["sol", "neptu", "sudigital"]),
});

const buildClaimSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  amount: z.number().positive(),
  nonce: z.number().int().nonnegative(),
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
        clientBlockhash && clientBlockHeight != null
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
        clientBlockhash && clientBlockHeight != null
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
        clientBlockhash && clientBlockHeight != null
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

// POST /pay/verify - Verify payment and record in database
paymentRoutes.post(
  "/verify",
  zValidator("json", verifyPaymentSchema),
  async (c) => {
    const { txSignature, walletAddress, readingType, paymentType } =
      c.req.valid("json");
    const db = c.get("db");
    const userService = new UserService(db);
    const tokenService = new TokenTransactionService(db);
    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    try {
      // Check if already recorded
      const existingTx =
        await tokenService.getTransactionBySignature(txSignature);
      if (existingTx) {
        return c.json({
          success: true,
          transaction: existingTx,
          message: "Transaction already recorded",
        });
      }

      // Get or create user
      const user = await userService.getOrCreateUser(walletAddress);

      // Verify on-chain
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

      // Calculate amounts based on payment type
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

      // Store in database
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

      // Confirm transaction
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

// POST /claim/build - Build claim rewards transaction
paymentRoutes.post(
  "/claim/build",
  zValidator("json", buildClaimSchema),
  async (c) => {
    const {
      walletAddress,
      amount,
      nonce,
      blockhash: clientBlockhash,
      lastValidBlockHeight: clientBlockHeight,
    } = c.req.valid("json");
    const network =
      (c.env?.SOLANA_NETWORK as "devnet" | "mainnet") || DEFAULT_NETWORK;
    const solanaClient = getSolanaClient(c.env);

    try {
      const programs = await getPrograms(network);
      const userAddress = address(walletAddress);

      const userNeptuAccount = await deriveAssociatedTokenAddress(
        userAddress,
        programs.mintPda
      );

      const claimRecordPda = await deriveClaimRecordPda(
        userAddress,
        programs.economyProgramId
      );

      // TODO: Generate backend signature for claim authorization
      // For now, return empty signature (will be implemented with Ed25519 signing)
      const authSignature = new Uint8Array(64);

      const instruction = buildClaimRewardsInstruction(
        programs,
        userAddress,
        userNeptuAccount,
        claimRecordPda,
        BigInt(Math.round(amount * 1_000_000)), // Convert to raw amount (6 decimals)
        BigInt(nonce),
        authSignature
      );

      // Use client-provided blockhash if available, otherwise fetch from RPC
      const { blockhash, lastValidBlockHeight } =
        clientBlockhash && clientBlockHeight != null
          ? {
              blockhash: clientBlockhash,
              lastValidBlockHeight: BigInt(clientBlockHeight),
            }
          : await getLatestBlockhash(solanaClient.rpc, network);

      // Build a full unsigned transaction the client can sign
      const txMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (msg) => setTransactionMessageFeePayer(userAddress, msg),
        (msg) =>
          setTransactionMessageLifetimeUsingBlockhash(
            {
              blockhash: toBlockhash(blockhash),
              lastValidBlockHeight,
            },
            msg
          ),
        (msg) => appendTransactionMessageInstruction(instruction, msg)
      );

      const compiledTx = compileTransaction(txMessage);
      const txEncoder = getTransactionEncoder();
      const serializedTx = txEncoder.encode(compiledTx);

      return c.json({
        success: true,
        serializedTransaction: Array.from(serializedTx),
        transaction: {
          blockhash,
          lastValidBlockHeight: Number(lastValidBlockHeight),
        },
        claim: {
          amount,
          nonce,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to build claim instruction",
        },
        500
      );
    }
  }
);

// Pricing routes (extracted to payment-pricing.ts)
import { paymentPricingRoutes } from "./payment-pricing";
paymentRoutes.route("/pricing", paymentPricingRoutes);
