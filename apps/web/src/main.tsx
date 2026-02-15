import { handleServerError } from "@/lib/handle-server-error";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";

import { DirectionProvider } from "./context/direction-provider";
import { FontProvider } from "./context/font-provider";
import { ThemeProvider } from "./context/theme-provider";
// Generated Routes
import { routeTree } from "./routeTree.gen";
// Styles
import "./styles/index.css";

// Suppress Privy's internal key warning (it's a library bug in their Me component)
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  const originalConsoleError = console.error;
  // eslint-disable-next-line no-console
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Each child in a list should have a unique") &&
      args.some((arg) => typeof arg === "string" && arg.includes("Me"))
    ) {
      return; // Suppress Privy's internal key warning
    }
    originalConsoleError.apply(console, args);
  };
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

// Privy configuration
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

const SOLANA_DEVNET_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const SOLANA_DEVNET_WSS = SOLANA_DEVNET_RPC.replace("https://", "wss://");

const privyConfig = {
  appearance: {
    theme: "dark" as const,
    accentColor: "#22c55e" as `#${string}`,
    logo: "/neptu-logo.svg",
    landingHeader: "Connect to Neptu",
    showWalletLoginFirst: true,
    walletChainType: "solana-only" as const,
  },
  loginMethods: ["wallet", "email"] as ("wallet" | "email")[],
  embeddedWallets: {
    solana: {
      createOnLogin: "users-without-wallets" as const,
    },
    ethereum: {
      createOnLogin: "off" as const,
    },
  },
  externalWallets: {
    solana: {
      connectors: solanaConnectors,
    },
  },
  solana: {
    rpcs: {
      "solana:devnet": {
        rpc: createSolanaRpc(SOLANA_DEVNET_RPC),
        rpcSubscriptions: createSolanaRpcSubscriptions(SOLANA_DEVNET_WSS),
      },
    },
  },
};

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID || ""}
        config={privyConfig}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FontProvider>
              <DirectionProvider>
                <RouterProvider router={router} />
              </DirectionProvider>
            </FontProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </StrictMode>
  );
}
