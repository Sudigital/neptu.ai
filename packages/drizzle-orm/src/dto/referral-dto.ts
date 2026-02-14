import type { Referral } from "../schemas/referrals";

export type ReferralPaymentStatus = "pending" | "paid";

export interface ReferralDTO {
  id: string;
  referrerId: string;
  refereeId: string;
  referrerRewardAmount: number | null;
  refereeRewardAmount: number | null;
  referrerRewardPaid: ReferralPaymentStatus;
  refereeRewardPaid: ReferralPaymentStatus;
  referrerRewardTxSignature: string | null;
  refereeRewardTxSignature: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function toReferralDTO(referral: Referral): ReferralDTO {
  return {
    id: referral.id,
    referrerId: referral.referrerId,
    refereeId: referral.refereeId,
    referrerRewardAmount: referral.referrerRewardAmount
      ? Number(referral.referrerRewardAmount)
      : null,
    refereeRewardAmount: referral.refereeRewardAmount
      ? Number(referral.refereeRewardAmount)
      : null,
    referrerRewardPaid: referral.referrerRewardPaid as ReferralPaymentStatus,
    refereeRewardPaid: referral.refereeRewardPaid as ReferralPaymentStatus,
    referrerRewardTxSignature: referral.referrerRewardTxSignature,
    refereeRewardTxSignature: referral.refereeRewardTxSignature,
    createdAt: referral.createdAt.toISOString(),
    completedAt: referral.completedAt,
  };
}

export function toReferralDTOList(referrals: Referral[]): ReferralDTO[] {
  return referrals.map(toReferralDTO);
}
