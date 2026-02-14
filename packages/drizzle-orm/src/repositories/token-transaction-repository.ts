import { eq, desc, and } from "drizzle-orm";
import type { Database } from "../client";
import {
  tokenTransactions,
  type NewTokenTransaction,
  type TokenTransaction,
} from "../schemas/token-transactions";

export interface FindTokenTransactionsOptions {
  userId: string;
  transactionType?:
    | "sol_payment"
    | "neptu_payment"
    | "sudigital_payment"
    | "neptu_reward"
    | "neptu_burn";
  status?: "pending" | "confirmed" | "failed";
  limit?: number;
  offset?: number;
}

export class TokenTransactionRepository {
  constructor(private db: Database) {}

  async create(
    data: Omit<NewTokenTransaction, "id">,
  ): Promise<TokenTransaction> {
    const id = crypto.randomUUID();
    const result = await this.db
      .insert(tokenTransactions)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  async findById(id: string): Promise<TokenTransaction | null> {
    const result = await this.db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByTxSignature(
    txSignature: string,
  ): Promise<TokenTransaction | null> {
    const result = await this.db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.txSignature, txSignature))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUser(
    options: FindTokenTransactionsOptions,
  ): Promise<TokenTransaction[]> {
    const { userId, transactionType, status, limit = 50, offset = 0 } = options;

    const conditions = [eq(tokenTransactions.userId, userId)];
    if (transactionType) {
      conditions.push(eq(tokenTransactions.transactionType, transactionType));
    }
    if (status) {
      conditions.push(eq(tokenTransactions.status, status));
    }

    return this.db
      .select()
      .from(tokenTransactions)
      .where(and(...conditions))
      .orderBy(desc(tokenTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateStatus(
    txSignature: string,
    status: "pending" | "confirmed" | "failed",
    confirmedAt?: string,
  ): Promise<TokenTransaction | null> {
    const result = await this.db
      .update(tokenTransactions)
      .set({ status, confirmedAt })
      .where(eq(tokenTransactions.txSignature, txSignature))
      .returning();
    return result[0] ?? null;
  }

  async getTotalNeptuRewarded(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(tokenTransactions)
      .where(
        and(
          eq(tokenTransactions.userId, userId),
          eq(tokenTransactions.status, "confirmed"),
        ),
      );

    return result.reduce((sum, tx) => sum + Number(tx.neptuRewarded || 0), 0);
  }

  async getTotalNeptuBurned(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(tokenTransactions)
      .where(
        and(
          eq(tokenTransactions.userId, userId),
          eq(tokenTransactions.status, "confirmed"),
        ),
      );

    return result.reduce((sum, tx) => sum + Number(tx.neptuBurned || 0), 0);
  }

  async getTotalSolSpent(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(tokenTransactions)
      .where(
        and(
          eq(tokenTransactions.userId, userId),
          eq(tokenTransactions.transactionType, "sol_payment"),
          eq(tokenTransactions.status, "confirmed"),
        ),
      );

    return result.reduce((sum, tx) => sum + Number(tx.solAmount || 0), 0);
  }
}
