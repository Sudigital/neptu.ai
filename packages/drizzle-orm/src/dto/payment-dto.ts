import type { Payment } from "../schemas/payments";

export interface PaymentDTO {
  id: string;
  userId: string;
  readingId: string | null;
  paymentType: "sol" | "neptu" | "sudigital";
  amount: number;
  neptuReward: number | null;
  neptuBurned: number | null;
  txSignature: string;
  status: "pending" | "confirmed" | "failed";
  createdAt: string;
  confirmedAt: string | null;
}

export function toPaymentDTO(payment: Payment): PaymentDTO {
  return {
    id: payment.id,
    userId: payment.userId,
    readingId: payment.readingId,
    paymentType: payment.paymentType,
    amount: Number(payment.amount),
    neptuReward: payment.neptuReward ? Number(payment.neptuReward) : null,
    neptuBurned: payment.neptuBurned ? Number(payment.neptuBurned) : null,
    txSignature: payment.txSignature,
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    confirmedAt: payment.confirmedAt,
  };
}

export function toPaymentDTOList(payments: Payment[]): PaymentDTO[] {
  return payments.map(toPaymentDTO);
}
