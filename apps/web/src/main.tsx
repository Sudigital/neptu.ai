import { handleServerError } from "@/lib/handle-server-error";
import {
  DynamicContextProvider,
  useAuthenticateConnectedUser,
  useDynamicContext,
  useIsLoggedIn,
} from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { StrictMode, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";

import { DirectionProvider } from "./context/direction-provider";
import { FontProvider } from "./context/font-provider";
import { ThemeProvider } from "./context/theme-provider";
// Generated Routes
import { routeTree } from "./routeTree.gen";
// Styles
import "./styles/index.css";

const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || "devnet";
const SOLANA_RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL ||
  `https://api.${SOLANA_NETWORK}.solana.com`;

const DYNAMIC_ENVIRONMENT_ID =
  import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || "";
if (!DYNAMIC_ENVIRONMENT_ID) {
  throw new Error("VITE_DYNAMIC_ENVIRONMENT_ID is required");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error });

        if (failureCount >= 0 && import.meta.env.DEV) return false;
        if (failureCount > 3 && import.meta.env.PROD) return false;

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        );
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error);

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error("Content not modified!");
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error("Session expired!");
          router.navigate({ to: "/" });
        }
        if (error.response?.status === 500) {
          toast.error("Internal Server Error!");
          router.navigate({ to: "/500" });
        }
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
});

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * Auto-triggers wallet authentication (sign message) after wallet connects.
 * Uses connect-only mode so the wallet connects without signing,
 * then triggers signing separately so Phantom's popup isn't covered by Dynamic's modal.
 */
function WalletAuthenticator({ children }: { children: React.ReactNode }) {
  const { primaryWallet } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const { authenticateUser, isAuthenticating } = useAuthenticateConnectedUser();
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Trigger authentication when wallet connects but user isn't signed in yet
    if (
      primaryWallet &&
      !isLoggedIn &&
      !isAuthenticating &&
      !hasTriggered.current
    ) {
      hasTriggered.current = true;
      authenticateUser().catch(() => {
        // Reset so user can retry
        hasTriggered.current = false;
      });
    }

    // Reset when wallet disconnects
    if (!primaryWallet) {
      hasTriggered.current = false;
    }
  }, [primaryWallet, isLoggedIn, isAuthenticating, authenticateUser]);

  return <>{children}</>;
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <DynamicContextProvider
        settings={{
          environmentId: DYNAMIC_ENVIRONMENT_ID,
          walletConnectors: [SolanaWalletConnectors],
          initialAuthenticationMode: "connect-only",
          overrides: {
            solNetworks: [
              {
                chainId: "devnet",
                networkId: "devnet",
                name: "Solana Devnet",
                iconUrls: [
                  "https://app.dynamic.xyz/assets/networks/solana.svg",
                ],
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
        <WalletAuthenticator>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <FontProvider>
                <DirectionProvider>
                  <RouterProvider router={router} />
                </DirectionProvider>
              </FontProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </WalletAuthenticator>
      </DynamicContextProvider>
    </StrictMode>
  );
}
