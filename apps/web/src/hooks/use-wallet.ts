import { usePrivy, useWallets } from "@privy-io/react-auth";

/**
 * Custom hook to get the user's Solana wallet address.
 * This handles both:
 * 1. External wallets connected via useWallets (for transactions)
 * 2. Wallets linked to the Privy user account (for identification)
 */
export function useWallet() {
  const { user, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // Get SOLANA wallet from useWallets (filter by chainType)
  const connectedWallet = wallets.find((w) => w.chainType === "solana");

  // Get SOLANA wallet from user's linked accounts
  const linkedWallet = user?.linkedAccounts?.find(
    (
      account,
    ): account is {
      type: "wallet";
      address: string;
      chainType?: string;
      verifiedAt?: Date;
    } => account.type === "wallet" && account.chainType === "solana",
  );

  // Also check user.wallet (Privy's embedded wallet - should be Solana if configured)
  const privyWallet = user?.wallet;
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

  return {
    walletAddress,
    wallet: connectedWallet || null,
    hasWallet,
    ready,
    // For debugging
    debug: {
      connectedWallet: connectedWallet?.address,
      linkedWallet: linkedWallet?.address,
      privyWallet: privyWallet?.address,
      linkedAccounts: user?.linkedAccounts,
      allWallets: wallets.map((w) => ({
        address: w.address,
        type: w.walletClientType,
        chain: w.chainType,
      })),
    },
  };
}
