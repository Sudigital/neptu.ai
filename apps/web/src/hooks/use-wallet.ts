import {
  usePrivy,
  useWallets,
  type LinkedAccountWithMetadata,
  type WalletWithMetadata,
} from "@privy-io/react-auth";

function isWalletAccount(
  account: LinkedAccountWithMetadata,
): account is WalletWithMetadata {
  return account.type === "wallet";
}

function isSolanaWallet(account: WalletWithMetadata): boolean {
  return account.chainType === "solana";
}

export function useWallet() {
  const { user, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // Get SOLANA wallet from useWallets (connected wallets have chainType)
  const connectedWallet = wallets.find(
    (w) => "chainType" in w && w.chainType === "solana",
  );

  // Get SOLANA wallet from user's linked accounts
  const linkedWallet = user?.linkedAccounts?.find(
    (account): account is WalletWithMetadata =>
      isWalletAccount(account) && isSolanaWallet(account),
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
        chain: "chainType" in w ? w.chainType : undefined,
      })),
    },
  };
}
