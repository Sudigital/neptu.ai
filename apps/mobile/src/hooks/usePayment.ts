import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useState, useCallback } from "react";

import type { PaymentBuildResponse } from "../types";

import { signAndSendTransaction } from "../services/solana-mobile";
import { getMwaAuthToken } from "../services/storage";
import { buildPaymentTx, verifyPayment } from "../services/voice-api";

type PaymentType = "sol" | "neptu" | "sudigital";

interface UsePaymentReturn {
  isPaying: boolean;
  error: string | null;
  lastTxSignature: string | null;
  pay: (
    walletAddress: string,
    readingType: string,
    paymentType: PaymentType
  ) => Promise<boolean>;
}

export function usePayment(): UsePaymentReturn {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

  const pay = useCallback(
    async (
      walletAddress: string,
      readingType: string,
      paymentType: PaymentType
    ): Promise<boolean> => {
      setIsPaying(true);
      setError(null);
      setLastTxSignature(null);

      try {
        // Step 1: Build payment transaction on the API
        const buildResponse = await buildPaymentTx(
          walletAddress,
          readingType,
          paymentType
        );

        if (!buildResponse.success) {
          throw new Error("Failed to build payment transaction");
        }

        // Step 2: Assemble a Solana Transaction from API instruction data
        const authToken = getMwaAuthToken();
        const serializedTx = assembleTransaction(buildResponse);
        const txSignature = await signAndSendTransaction(
          serializedTx,
          authToken
        );

        if (!txSignature) {
          throw new Error("Transaction signing was cancelled");
        }

        setLastTxSignature(txSignature);

        // Step 3: Verify payment on the server
        const verification = await verifyPayment(
          walletAddress,
          txSignature,
          readingType,
          paymentType
        );

        if (!verification.success) {
          throw new Error(verification.error ?? "Payment verification failed");
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Payment failed";
        setError(msg);
        return false;
      } finally {
        setIsPaying(false);
      }
    },
    []
  );

  return { isPaying, error, lastTxSignature, pay };
}

function assembleTransaction(build: PaymentBuildResponse): string {
  const { instruction: ixData, transaction: txMeta } = build;

  const keys = ixData.accounts.map((acc) => ({
    pubkey: new PublicKey(acc.address),
    // role bitmask: 0x01 = writable, 0x02 = signer
    isSigner: (acc.role & 0x02) !== 0,
    isWritable: (acc.role & 0x01) !== 0,
  }));

  const ix = new TransactionInstruction({
    programId: new PublicKey(ixData.programId),
    keys,
    data: Buffer.from(ixData.data),
  });

  const tx = new Transaction();
  tx.recentBlockhash = txMeta.blockhash;
  tx.lastValidBlockHeight = txMeta.lastValidBlockHeight;

  // Fee payer is the first signer account
  const signer = keys.find((k) => k.isSigner);
  if (signer) {
    tx.feePayer = signer.pubkey;
  }

  tx.add(ix);

  // Serialize without requiring signatures — MWA will sign
  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  return Buffer.from(serialized).toString("base64");
}
