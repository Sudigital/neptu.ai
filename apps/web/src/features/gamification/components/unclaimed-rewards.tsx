import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Coins, Loader2, Flame, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RewardType } from "@neptu/shared";

interface RewardItem {
  id: string;
  rewardType: RewardType;
  neptuAmount: number;
  description: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface UnclaimedRewardsProps {
  rewards: RewardItem[];
  totalAmount: number;
  onClaim: () => void;
  isLoading?: boolean;
  isClaiming?: boolean;
  className?: string;
}

const REWARD_ICONS: Record<RewardType, React.ReactNode> = {
  daily_check_in: <Calendar className="h-4 w-4 text-blue-500" />,
  streak_bonus: <Flame className="h-4 w-4 text-orange-500" />,
  first_reading: <Gift className="h-4 w-4 text-purple-500" />,
  referral: <Users className="h-4 w-4 text-green-500" />,
  referee_bonus: <Users className="h-4 w-4 text-teal-500" />,
  social_share: <Gift className="h-4 w-4 text-pink-500" />,
  auspicious_day: <Calendar className="h-4 w-4 text-yellow-500" />,
  payment_reward: <Coins className="h-4 w-4 text-amber-500" />,
};

const REWARD_LABELS: Record<RewardType, string> = {
  daily_check_in: "Daily Check-in",
  streak_bonus: "Streak Bonus",
  first_reading: "First Reading",
  referral: "Referral",
  referee_bonus: "Welcome Bonus",
  social_share: "Social Share",
  auspicious_day: "Auspicious Day",
  payment_reward: "Payment Reward",
};

export function UnclaimedRewards({
  rewards,
  totalAmount,
  onClaim,
  isLoading = false,
  isClaiming = false,
  className,
}: UnclaimedRewardsProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (rewards.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No unclaimed rewards</p>
          <p className="text-sm text-muted-foreground mt-1">
            Keep checking in daily to earn NEPTU!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Unclaimed Rewards
            </CardTitle>
            <CardDescription>
              {rewards.length} reward{rewards.length !== 1 ? "s" : ""} waiting
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalAmount.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">NEPTU</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rewards list */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                {REWARD_ICONS[reward.rewardType]}
                <div>
                  <p className="text-sm font-medium">
                    {REWARD_LABELS[reward.rewardType]}
                  </p>
                  {reward.description && (
                    <p className="text-xs text-muted-foreground">
                      {reward.description}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="secondary">+{reward.neptuAmount} NEPTU</Badge>
            </div>
          ))}
        </div>

        {/* Claim button */}
        <Button
          onClick={onClaim}
          disabled={isClaiming}
          className="w-full"
          size="lg"
        >
          {isClaiming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Claim {totalAmount.toFixed(1)} NEPTU
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
