import { zValidator } from "@hono/zod-validator";
import { type Database } from "@neptu/drizzle-orm";
import { DEFAULT_NETWORK } from "@neptu/shared";
import {
  createSolanaClient,
  createNeptuPrograms,
  deriveAssociatedTokenAddress,
  deriveClaimRecordPda,
  buildClaimRewardsInstruction,
  getLatestBlockhash,
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

import { type AuthEnv } from "../../middleware/paseto-auth";

type Env = {
  Variables: { db: Database } & AuthEnv["Variables"];
  Bindings: {
    SOLANA_NETWORK?: string;
    SOLANA_RPC_URL?: string;
  };
};

const programsCache: Map<string, NeptuPrograms> = new Map();

async function getPrograms(
  network: "devnet" | "mainnet"
): Promise<NeptuPrograms> {
  if (!programsCache.has(network)) {
    programsCache.set(network, await createNeptuPrograms(network));
  }
  return programsCache.get(network)!;
}

const buildClaimSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  amount: z.number().positive(),
  nonce: z.number().int().nonnegative(),
  blockhash: z.string().optional(),
  lastValidBlockHeight: z.number().optional(),
});

export const paymentClaimRoutes = new Hono<Env>();

paymentClaimRoutes.post(
  "/build",
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
    const solanaClient = createSolanaClient(network, c.env?.SOLANA_RPC_URL);

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
      const authSignature = new Uint8Array(64);

      const instruction = buildClaimRewardsInstruction({
        programs,
        user: userAddress,
        userNeptuAccount,
        claimRecordPda,
        amount: BigInt(Math.round(amount * 1_000_000)),
        nonce: BigInt(nonce),
        signature: authSignature,
      });

      const { blockhash, lastValidBlockHeight } =
        clientBlockhash &&
        clientBlockHeight !== null &&
        clientBlockHeight !== undefined
          ? {
              blockhash: clientBlockhash,
              lastValidBlockHeight: BigInt(clientBlockHeight),
            }
          : await getLatestBlockhash(solanaClient.rpc, network);

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
