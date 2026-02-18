import type { SolanaSignAndSendTransactionFeature } from "@solana/wallet-standard-features";

import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StreakCounter,
  UnclaimedRewards,
} from "@/features/gamification/components";
import { OracleSheet } from "@/features/oracle";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { neptuApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWallets } from "@wallet-standard/app";
import { Wallet as WalletIcon, ArrowRight } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import { TokenBalance } from "./components/token-balance";
import { TokenStatsCard } from "./components/token-stats";
import { TransactionHistory } from "./components/transaction-history";

// Utility: convert Uint8Array signature to base58 string
function toBase58(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt(0);
  for (const b of bytes) num = num * 256n + BigInt(b);
  let str = "";
  while (num > 0n) {
    str = ALPHABET[Number(num % 58n)] + str;
    num = num / 58n;
  }
  for (const b of bytes) {
    if (b === 0) str = `1${str}`;
    else break;
  }
  return str;
}

const SOLANA_CHAIN = `solana:${import.meta.env.VITE_SOLANA_NETWORK || "devnet"}`;

/** Sign and send a serialized Solana transaction via Wallet Standard */
async function signAndSendSolanaTransaction(
  walletAddress: string,
  transactionBytes: Uint8Array
): Promise<{ signature: Uint8Array }> {
  const registeredWallets = getWallets().get();

  for (const wallet of registeredWallets) {
    const feature = wallet.features["solana:signAndSendTransaction"] as
      | SolanaSignAndSendTransactionFeature["solana:signAndSendTransaction"]
      | undefined;
    if (!feature) continue;

    const account = wallet.accounts.find((a) => a.address === walletAddress);
    if (!account) continue;

    const [result] = await feature.signAndSendTransaction({
      account,
      transaction: transactionBytes,
      chain: SOLANA_CHAIN,
    });

    return { signature: result.signature };
  }

  throw new Error("No compatible Solana wallet found for signing");
}

export function Wallet() {
  const { walletAddress } = useUser();
  const queryClient = useQueryClient();
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const t = useTranslate();
  const { sudigitalBalance } = useWalletBalance();

  const topNav = [
    { title: t("nav.overview"), href: "/dashboard", isActive: false },
    { title: t("nav.wallet"), href: "/wallet", isActive: true },
  ];

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

  // Get transaction history
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", walletAddress],
    queryFn: () => neptuApi.getTransactions(walletAddress, { limit: 20 }),
    enabled: !!walletAddress,
  });

  // Get token stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["tokenStats", walletAddress],
    queryFn: () => neptuApi.getTokenStats(walletAddress),
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
          error instanceof Error
            ? error.message
            : t("wallet.tryAgain", "Please try again."),
      });
    },
  });

  const handleClaimRewards = useCallback(async () => {
    if (!rewardsData?.rewards?.length || !walletAddress) return;

    setIsClaimingRewards(true);
    const loadingToast = toast.loading(t("wallet.claimingRewards"));

    try {
      const totalAmount = rewardsData.totalPending;
      const claimNonce = Date.now();

      // 0. Fetch blockhash client-side (avoids Solana RPC rate-limiting on CF Workers)
      const rpcUrl =
        import.meta.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";
      const bhRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
          params: [{ commitment: "confirmed" }],
        }),
      });
      const bhData = (await bhRes.json()) as {
        result?: { value: { blockhash: string; lastValidBlockHeight: number } };
      };
      if (!bhData.result) throw new Error("Failed to fetch blockhash");
      const { blockhash, lastValidBlockHeight } = bhData.result.value;

      // 1. Build the claim transaction via API (with client-provided blockhash)
      const buildResult = await neptuApi.buildClaimInstruction(
        walletAddress,
        totalAmount,
        claimNonce,
        blockhash,
        lastValidBlockHeight
      );

      if (!buildResult.success || !buildResult.serializedTransaction) {
        throw new Error("Failed to build claim transaction");
      }

      // 2. Sign and send the transaction on-chain via Wallet Standard
      const txBytes = new Uint8Array(buildResult.serializedTransaction);
      const { signature } = await signAndSendSolanaTransaction(
        walletAddress,
        txBytes
      );

      // Convert signature bytes to base58 string
      const txSignature = toBase58(signature);

      // 3. Mark rewards as claimed in the database with real tx signature
      const claimPromises = rewardsData.rewards.map((reward) =>
        neptuApi.claimReward(walletAddress, reward.id, txSignature)
      );
      await Promise.all(claimPromises);

      // Refresh data and show success
      toast.dismiss(loadingToast);
      toast.success(t("wallet.claimSuccess"), {
        description: t("wallet.claimSuccessDesc").replace(
          "{amount}",
          totalAmount.toFixed(2)
        ),
      });

      // Invalidate all wallet queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["pendingRewards", walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokenBalance", walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions", walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokenStats", walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["streak", walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["walletBalances", walletAddress],
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(t("wallet.claimFailed"), {
        description:
          error instanceof Error ? error.message : t("wallet.claimFailedDesc"),
      });
    } finally {
      setIsClaimingRewards(false);
    }
  }, [rewardsData, walletAddress, queryClient, t]);

  const handleRefreshBalance = () => {
    refetchBalance();
    refetchRewards();
    refetchStreak();
  };

  return (
    <>
      <Header fixed>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center gap-3 sm:gap-4">
          <OracleSheet />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <WalletIcon className="h-6 w-6" />
            {t("wallet.title")}
          </h1>
          <p className="text-muted-foreground">{t("wallet.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Token Balance Card */}
          <TokenBalance
            balance={balanceData?.balance?.formatted ?? 0}
            rawBalance={balanceData?.balance?.raw ?? "0"}
            walletAddress={walletAddress}
            pendingRewards={balanceData?.pendingRewards ?? 0}
            onRefresh={handleRefreshBalance}
            isLoading={balanceLoading}
            isRefreshing={isRefreshingBalance}
          />

          {/* SUDIGITAL Balance Card */}
          <TokenBalance
            balance={sudigitalBalance}
            rawBalance={String(Math.round(sudigitalBalance * 1e6))}
            walletAddress={walletAddress}
            onRefresh={handleRefreshBalance}
            isLoading={balanceLoading}
            isRefreshing={isRefreshingBalance}
            tokenSymbol="SUDIGITAL"
            tokenTitle={t("wallet.sudigitalBalance", "SUDIGITAL Balance")}
            iconClassName="text-blue-500"
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
          <div className="md:col-span-3">
            <UnclaimedRewards
              rewards={rewardsData?.rewards ?? []}
              totalAmount={rewardsData?.totalPending ?? 0}
              onClaim={handleClaimRewards}
              isLoading={rewardsLoading}
              isClaiming={isClaimingRewards}
            />
          </div>

          {/* Token Stats */}
          <TokenStatsCard
            stats={statsData?.stats ?? null}
            isLoading={statsLoading}
            className="md:col-span-3"
          />

          {/* Transaction History */}
          <div className="md:col-span-2">
            <TransactionHistory
              transactions={transactionsData?.transactions ?? []}
              isLoading={transactionsLoading}
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
                  className="h-auto justify-start p-4"
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
                  className="h-auto justify-start p-4"
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
                  className="h-auto justify-start p-4"
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
