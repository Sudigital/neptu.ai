import { eq, desc, and } from "drizzle-orm";
import type { Database } from "../client";
import { payments, type NewPayment, type Payment } from "../schemas/payments";

export interface FindPaymentsOptions {
  userId: string;
  status?: "pending" | "confirmed" | "failed";
  limit?: number;
  offset?: number;
}

export class PaymentRepository {
  constructor(private db: Database) {}

  async create(data: Omit<NewPayment, "id">): Promise<Payment> {
    const id = crypto.randomUUID();
    const result = await this.db
      .insert(payments)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  async findById(id: string): Promise<Payment | null> {
    const result = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByTxSignature(txSignature: string): Promise<Payment | null> {
    const result = await this.db
      .select()
      .from(payments)
      .where(eq(payments.txSignature, txSignature))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUser(options: FindPaymentsOptions): Promise<Payment[]> {
    const { userId, status, limit = 50, offset = 0 } = options;

    const conditions = [eq(payments.userId, userId)];
    if (status) {
      conditions.push(eq(payments.status, status));
    }

    return this.db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateStatus(
    txSignature: string,
    status: "pending" | "confirmed" | "failed",
    confirmedAt?: string,
  ): Promise<Payment | null> {
    const result = await this.db
      .update(payments)
      .set({ status, confirmedAt })
      .where(eq(payments.txSignature, txSignature))
      .returning();
    return result[0] ?? null;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));
    return result.length;
  }

  async sumByUser(
    userId: string,
    paymentType?: "sol" | "neptu",
  ): Promise<number> {
    const conditions = [
      eq(payments.userId, userId),
      eq(payments.status, "confirmed"),
    ];
    if (paymentType) {
      conditions.push(eq(payments.paymentType, paymentType));
    }

    const result = await this.db
      .select()
      .from(payments)
      .where(and(...conditions));

    return result.reduce((sum, p) => sum + Number(p.amount), 0);
  }
}
