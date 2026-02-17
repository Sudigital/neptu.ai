import type { ReactNode } from "react";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";

const DYNAMIC_ENVIRONMENT_ID =
  import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || "";

if (!DYNAMIC_ENVIRONMENT_ID) {
  throw new Error("VITE_DYNAMIC_ENVIRONMENT_ID is required");
}

const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || "devnet";
const SOLANA_RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL ||
  `https://api.${SOLANA_NETWORK}.solana.com`;

interface DynamicAuthProviderProps {
  children: ReactNode;
}

export function DynamicAuthProvider({ children }: DynamicAuthProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [SolanaWalletConnectors],
        initialAuthenticationMode: "connect-only",
        embeddedWallets: {
          createOnLogin: "all-users",
          showTransactionUi: true,
        },
        overrides: {
          solNetworks: [
            {
              chainId: SOLANA_NETWORK,
              networkId: SOLANA_NETWORK,
              name:
                SOLANA_NETWORK === "mainnet-beta"
                  ? "Solana Mainnet"
                  : `Solana ${SOLANA_NETWORK.charAt(0).toUpperCase()}${SOLANA_NETWORK.slice(1)}`,
              iconUrls: ["https://app.dynamic.xyz/assets/networks/solana.svg"],
              nativeCurrency: {
                name: "Solana",
                symbol: "SOL",
                decimals: 9,
              },
              rpcUrls: [SOLANA_RPC_URL],
              blockExplorerUrls: [
                `https://explorer.solana.com/?cluster=${SOLANA_NETWORK}`,
              ],
              isTestnet: SOLANA_NETWORK !== "mainnet-beta",
            },
          ],
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
