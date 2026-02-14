import type { Database } from "../client";
import { PaymentRepository } from "../repositories/payment-repository";
import {
  toPaymentDTO,
  toPaymentDTOList,
  type PaymentDTO,
} from "../dto/payment-dto";
import {
  createPaymentSchema,
  updatePaymentStatusSchema,
  getPaymentsByUserSchema,
  type CreatePaymentInput,
  type UpdatePaymentStatusInput,
  type GetPaymentsByUserInput,
} from "../validators/payment-validator";

export class PaymentService {
  private repository: PaymentRepository;

  constructor(db: Database) {
    this.repository = new PaymentRepository(db);
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentDTO> {
    const validated = createPaymentSchema.parse(input);

    const payment = await this.repository.create({
      userId: validated.userId,
      readingId: validated.readingId,
      paymentType: validated.paymentType,
      amount: validated.amount.toString(),
      neptuReward: validated.neptuReward?.toString(),
      neptuBurned: validated.neptuBurned?.toString(),
      txSignature: validated.txSignature,
    });

    return toPaymentDTO(payment);
  }

  async getPaymentByTx(txSignature: string): Promise<PaymentDTO | null> {
    const payment = await this.repository.findByTxSignature(txSignature);
    return payment ? toPaymentDTO(payment) : null;
  }

  async getPaymentsByUser(
    input: GetPaymentsByUserInput,
  ): Promise<PaymentDTO[]> {
    const validated = getPaymentsByUserSchema.parse(input);

    const payments = await this.repository.findByUser({
      userId: validated.userId,
      status: validated.status,
      limit: validated.limit,
      offset: validated.offset,
    });

    return toPaymentDTOList(payments);
  }

  async confirmPayment(
    input: UpdatePaymentStatusInput,
  ): Promise<PaymentDTO | null> {
    const validated = updatePaymentStatusSchema.parse(input);

    const payment = await this.repository.updateStatus(
      validated.txSignature,
      validated.status,
      validated.confirmedAt,
    );

    return payment ? toPaymentDTO(payment) : null;
  }

  async getUserPaymentStats(userId: string): Promise<{
    totalPayments: number;
    totalSolSpent: number;
    totalNeptuSpent: number;
  }> {
    const totalPayments = await this.repository.countByUser(userId);
    const totalSolSpent = await this.repository.sumByUser(userId, "sol");
    const totalNeptuSpent = await this.repository.sumByUser(userId, "neptu");

    return {
      totalPayments,
      totalSolSpent,
      totalNeptuSpent,
    };
  }
}
