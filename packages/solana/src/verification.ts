import { signature as createSignature } from "@solana/kit";
import type { SolanaRpc } from "./client";
import { getAddresses, lamportsToSol, rawToNeptu } from "./constants";
import type { NetworkType } from "@neptu/shared";

export interface TransactionVerification {
  isValid: boolean;
  signature: string;
  sender: string;
  recipient: string;
  amount: bigint;
  amountFormatted: number;
  tokenType: "sol" | "neptu";
  error?: string;
}

interface ParsedInstruction {
  parsed?: {
    type: string;
    info: {
      source?: string;
      destination?: string;
      lamports?: number;
      amount?: string;
      authority?: string;
    };
  };
  program?: string;
}

export async function verifyTransaction(
  rpc: SolanaRpc,
  signatureStr: string,
  network: NetworkType,
): Promise<TransactionVerification> {
  try {
    const result = await rpc
      .getTransaction(createSignature(signatureStr), {
        encoding: "jsonParsed",
        maxSupportedTransactionVersion: 0,
      })
      .send();

    if (!result) {
      return {
        isValid: false,
        signature: signatureStr,
        sender: "",
        recipient: "",
        amount: BigInt(0),
        amountFormatted: 0,
        tokenType: "sol",
        error: "Transaction not found",
      };
    }

    if (result.meta?.err) {
      return {
        isValid: false,
        signature: signatureStr,
        sender: "",
        recipient: "",
        amount: BigInt(0),
        amountFormatted: 0,
        tokenType: "sol",
        error: "Transaction failed",
      };
    }

    const addresses = getAddresses(network);
    const instructions = result.transaction.message
      .instructions as readonly ParsedInstruction[];

    for (const instruction of instructions) {
      if (
        instruction.parsed?.type === "transfer" &&
        instruction.program === "system"
      ) {
        const info = instruction.parsed.info;
        if (info.destination === addresses.treasury) {
          const amount = BigInt(info.lamports || 0);
          return {
            isValid: true,
            signature: signatureStr,
            sender: info.source || "",
            recipient: info.destination || "",
            amount,
            amountFormatted: lamportsToSol(amount),
            tokenType: "sol",
          };
        }
      }

      if (
        instruction.parsed?.type === "transfer" &&
        instruction.program === "spl-token"
      ) {
        const info = instruction.parsed.info;
        const amount = BigInt(info.amount || "0");
        return {
          isValid: true,
          signature: signatureStr,
          sender: info.authority || "",
          recipient: info.destination || "",
          amount,
          amountFormatted: rawToNeptu(amount),
          tokenType: "neptu",
        };
      }
    }

    return {
      isValid: false,
      signature: signatureStr,
      sender: "",
      recipient: "",
      amount: BigInt(0),
      amountFormatted: 0,
      tokenType: "sol",
      error: "No valid transfer found",
    };
  } catch (error) {
    return {
      isValid: false,
      signature: signatureStr,
      sender: "",
      recipient: "",
      amount: BigInt(0),
      amountFormatted: 0,
      tokenType: "sol",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function waitForConfirmation(
  rpc: SolanaRpc,
  signatureStr: string,
  maxRetries: number = 30,
  delayMs: number = 1000,
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await rpc
      .getSignatureStatuses([createSignature(signatureStr)])
      .send();
    const status = result.value[0];

    if (status !== null) {
      if (status.err) {
        return false;
      }
      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        return true;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}
