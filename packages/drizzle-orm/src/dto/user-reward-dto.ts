import type { RewardType, RewardStatus } from "@neptu/shared";
import type { UserReward } from "../schemas/user-rewards";

export interface UserRewardDTO {
  id: string;
  userId: string;
  rewardType: RewardType;
  neptuAmount: number;
  status: RewardStatus;
  description: string | null;
  claimTxSignature: string | null;
  expiresAt: string | null;
  createdAt: string;
  claimedAt: string | null;
}

export function toUserRewardDTO(reward: UserReward): UserRewardDTO {
  return {
    id: reward.id,
    userId: reward.userId,
    rewardType: reward.rewardType as RewardType,
    neptuAmount: Number(reward.neptuAmount),
    status: reward.status as RewardStatus,
    description: reward.description,
    claimTxSignature: reward.claimTxSignature,
    expiresAt: reward.expiresAt,
    createdAt: reward.createdAt.toISOString(),
    claimedAt: reward.claimedAt,
  };
}

export function toUserRewardDTOList(rewards: UserReward[]): UserRewardDTO[] {
  return rewards.map(toUserRewardDTO);
}
