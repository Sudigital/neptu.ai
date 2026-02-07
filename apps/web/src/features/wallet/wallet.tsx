import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet as WalletIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { OracleSheet } from "@/features/oracle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { neptuApi } from "@/lib/api";
import { TokenBalance } from "./components/token-balance";
import {
  StreakCounter,
  UnclaimedRewards,
} from "@/features/gamification/components";
import { useWallet } from "@/hooks/use-wallet";
import { useTranslate } from "@/hooks/use-translate";

export function Wallet() {
  const { walletAddress } = useWallet();
  const queryClient = useQueryClient();
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const t = useTranslate();

  const topNav = [
    { title: t("nav.overview"), href: "/dashboard", isActive: false },
    { title: t("nav.wallet"), href: "/wallet", isActive: true },
  ];

  // Get user data - needed for Oracle sheet context
  useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => neptuApi.getOrCreateUser(walletAddress),
    enabled: !!walletAddress,
  });

  // Get token balance
  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
    isFetching: isRefreshingBalance,
  } = useQuery({
    queryKey: ["tokenBalance", walletAddress],
    queryFn: () => neptuApi.getTokenBalance(walletAddress),
    enabled: !!walletAddress,
    refetchOnWindowFocus: false,
  });

  // Get pending rewards
  const {
    data: rewardsData,
    isLoading: rewardsLoading,
    refetch: refetchRewards,
  } = useQuery({
    queryKey: ["pendingRewards", walletAddress],
    queryFn: () => neptuApi.getPendingRewards(walletAddress),
    enabled: !!walletAddress,
  });

  // Get streak info
  const {
    data: streakData,
    isLoading: streakLoading,
    refetch: refetchStreak,
  } = useQuery({
    queryKey: ["streak", walletAddress],
    queryFn: () => neptuApi.getStreakInfo(walletAddress),
    enabled: !!walletAddress,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () => neptuApi.checkIn(walletAddress),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["streak", walletAddress] });
      queryClient.invalidateQueries({
        queryKey: ["pendingRewards", walletAddress],
      });
      if (data.dailyRewardGranted) {
        toast.success(t("wallet.checkInSuccess"), {
          description: t("wallet.checkInSuccessDesc"),
        });
      }
      if (data.streakBonusGranted) {
        toast.success(t("wallet.streakMilestone"), {
          description: `${t("wallet.streakBonusDesc").replace("{amount}", String(data.streakBonusAmount))}`,
        });
      }
    },
    onError: (error) => {
      toast.error(t("wallet.checkInFailed"), {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const handleClaimRewards = async () => {
    if (!rewardsData?.rewards?.length) return;

    setIsClaimingRewards(true);
    try {
      // For now, we need to build and sign a claim transaction
      // This would typically involve:
      // 1. Call /api/pay/claim/build to get transaction
      // 2. Sign with wallet
      // 3. Submit and verify
      // For the hackathon demo, show a message about the flow
      toast.info(t("wallet.claimRewards"), {
        description: t("wallet.claimRewardsDesc"),
      });
    } finally {
      setIsClaimingRewards(false);
    }
  };

  const handleRefreshBalance = () => {
    refetchBalance();
    refetchRewards();
    refetchStreak();
  };

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <OracleSheet />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <WalletIcon className="h-6 w-6" />
            {t("wallet.title")}
          </h1>
          <p className="text-muted-foreground">{t("wallet.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Token Balance Card */}
          <TokenBalance
            balance={balanceData?.balance?.formatted ?? 0}
            rawBalance={balanceData?.balance?.raw ?? "0"}
            walletAddress={walletAddress}
            onRefresh={handleRefreshBalance}
            isLoading={balanceLoading}
            isRefreshing={isRefreshingBalance}
          />

          {/* Streak Counter Card */}
          <StreakCounter
            streak={streakData?.streak ?? null}
            onCheckIn={() => checkInMutation.mutate()}
            isLoading={streakLoading}
            isCheckingIn={checkInMutation.isPending}
            hasCheckedInToday={streakData?.hasCheckedInToday ?? false}
          />

          {/* Unclaimed Rewards Card */}
          <div className="md:col-span-2">
            <UnclaimedRewards
              rewards={rewardsData?.rewards ?? []}
              totalAmount={rewardsData?.totalPending ?? 0}
              onClaim={handleClaimRewards}
              isLoading={rewardsLoading}
              isClaiming={isClaimingRewards}
            />
          </div>

          {/* Quick Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("wallet.quickActions")}</CardTitle>
              <CardDescription>{t("wallet.quickActionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  asChild
                >
                  <a href="/dashboard">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium">
                        {t("wallet.getDailyReading")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("wallet.getDailyReadingDesc")}
                      </span>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  disabled
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">
                      {t("wallet.inviteFriends")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("wallet.inviteFriendsDesc")}
                    </span>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  disabled
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">
                      {t("wallet.tradeNeptu")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("wallet.tradeNeptuDesc")}
                    </span>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
