import type { Database } from "../client";
import { TokenTransactionRepository } from "../repositories/token-transaction-repository";
import {
  toTokenTransactionDTO,
  toTokenTransactionDTOList,
  type TokenTransactionDTO,
} from "../dto/token-transaction-dto";
import {
  createTokenTransactionSchema,
  updateTokenTransactionStatusSchema,
  getTokenTransactionsByUserSchema,
  type CreateTokenTransactionInput,
  type UpdateTokenTransactionStatusInput,
  type GetTokenTransactionsByUserInput,
} from "../validators/token-transaction-validator";

export interface TokenStats {
  totalNeptuRewarded: number;
  totalNeptuBurned: number;
  totalSolSpent: number;
  transactionCount: number;
}

export class TokenTransactionService {
  private repository: TokenTransactionRepository;

  constructor(db: Database) {
    this.repository = new TokenTransactionRepository(db);
  }

  async createTransaction(
    input: CreateTokenTransactionInput,
  ): Promise<TokenTransactionDTO> {
    const validated = createTokenTransactionSchema.parse(input);

    const transaction = await this.repository.create({
      userId: validated.userId,
      txSignature: validated.txSignature,
      transactionType: validated.transactionType,
      readingType: validated.readingType,
      solAmount: validated.solAmount?.toString(),
      neptuAmount: validated.neptuAmount?.toString(),
      neptuBurned: validated.neptuBurned?.toString(),
      neptuRewarded: validated.neptuRewarded?.toString(),
    });

    return toTokenTransactionDTO(transaction);
  }

  async getTransactionBySignature(
    txSignature: string,
  ): Promise<TokenTransactionDTO | null> {
    const transaction = await this.repository.findByTxSignature(txSignature);
    return transaction ? toTokenTransactionDTO(transaction) : null;
  }

  async getTransactionsByUser(
    input: GetTokenTransactionsByUserInput,
  ): Promise<TokenTransactionDTO[]> {
    const validated = getTokenTransactionsByUserSchema.parse(input);

    const transactions = await this.repository.findByUser({
      userId: validated.userId,
      transactionType: validated.transactionType,
      status: validated.status,
      limit: validated.limit,
      offset: validated.offset,
    });

    return toTokenTransactionDTOList(transactions);
  }

  async confirmTransaction(
    input: UpdateTokenTransactionStatusInput,
  ): Promise<TokenTransactionDTO | null> {
    const validated = updateTokenTransactionStatusSchema.parse(input);

    const transaction = await this.repository.updateStatus(
      validated.txSignature,
      validated.status,
      validated.confirmedAt,
    );

    return transaction ? toTokenTransactionDTO(transaction) : null;
  }

  async getUserTokenStats(userId: string): Promise<TokenStats> {
    const [totalNeptuRewarded, totalNeptuBurned, totalSolSpent, transactions] =
      await Promise.all([
        this.repository.getTotalNeptuRewarded(userId),
        this.repository.getTotalNeptuBurned(userId),
        this.repository.getTotalSolSpent(userId),
        this.repository.findByUser({ userId, status: "confirmed" }),
      ]);

    return {
      totalNeptuRewarded,
      totalNeptuBurned,
      totalSolSpent,
      transactionCount: transactions.length,
    };
  }
}
