import { neptuApi } from "@/lib/api";
import {
  usePrivy,
  type LinkedAccountWithMetadata,
  type WalletWithMetadata,
} from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useQuery } from "@tanstack/react-query";

function isWalletAccount(
  account: LinkedAccountWithMetadata
): account is WalletWithMetadata {
  return account.type === "wallet";
}

function isSolanaWallet(account: WalletWithMetadata): boolean {
  return account.chainType === "solana";
}

export function useUser() {
  const { user: privyUser, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // Get SOLANA wallet from useWallets (Solana-specific hook)
  const connectedWallet = wallets[0] ?? null;

  // Get SOLANA wallet from user's linked accounts
  const linkedWallet = privyUser?.linkedAccounts?.find(
    (account): account is WalletWithMetadata =>
      isWalletAccount(account) && isSolanaWallet(account)
  );

  // Also check user.wallet (Privy's embedded wallet - should be Solana if configured)
  const privyWallet = privyUser?.wallet;
  const isSolanaPrivyWallet =
    privyWallet && !privyWallet.address?.startsWith("0x");

  // Priority: connected Solana wallet > linked Solana wallet > privy wallet (if Solana)
  const walletAddress =
    connectedWallet?.address ||
    linkedWallet?.address ||
    (isSolanaPrivyWallet ? privyWallet?.address : "") ||
    "";

  const ready = privyReady && walletsReady;
  const hasWallet = !!walletAddress && !walletAddress.startsWith("0x");
  const wallet = connectedWallet || linkedWallet || null;

  // Fetch user from DB
  const {
    data,
    isPending: isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => neptuApi.getOrCreateUser(walletAddress!),
    enabled: !!walletAddress,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const isOnboarded = !!data?.user?.onboarded;
  const hasBirthDate = !!data?.user?.birthDate;

  return {
    user: data?.user,
    walletAddress,
    wallet,
    hasWallet,
    ready,
    isOnboarded,
    hasBirthDate,
    isLoading,
    isError,
    error,
    refetch,
  };
}
