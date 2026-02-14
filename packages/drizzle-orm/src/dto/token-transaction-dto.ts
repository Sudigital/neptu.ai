import type { TokenTransaction } from "../schemas/token-transactions";

export interface TokenTransactionDTO {
  id: string;
  userId: string;
  txSignature: string;
  transactionType:
    | "sol_payment"
    | "neptu_payment"
    | "sudigital_payment"
    | "neptu_reward"
    | "neptu_burn";
  readingType: "POTENSI" | "PELUANG" | "AI_CHAT" | "COMPATIBILITY" | null;
  solAmount: number | null;
  neptuAmount: number | null;
  sudigitalAmount: number | null;
  neptuBurned: number | null;
  neptuRewarded: number | null;
  status: "pending" | "confirmed" | "failed";
  createdAt: string;
  confirmedAt: string | null;
}

export function toTokenTransactionDTO(
  tx: TokenTransaction,
): TokenTransactionDTO {
  return {
    id: tx.id,
    userId: tx.userId,
    txSignature: tx.txSignature,
    transactionType: tx.transactionType,
    readingType: tx.readingType,
    solAmount: tx.solAmount ? Number(tx.solAmount) : null,
    neptuAmount: tx.neptuAmount ? Number(tx.neptuAmount) : null,
    sudigitalAmount: tx.sudigitalAmount ? Number(tx.sudigitalAmount) : null,
    neptuBurned: tx.neptuBurned ? Number(tx.neptuBurned) : null,
    neptuRewarded: tx.neptuRewarded ? Number(tx.neptuRewarded) : null,
    status: tx.status,
    createdAt: tx.createdAt.toISOString(),
    confirmedAt: tx.confirmedAt,
  };
}

export function toTokenTransactionDTOList(
  transactions: TokenTransaction[],
): TokenTransactionDTO[] {
  return transactions.map(toTokenTransactionDTO);
}
