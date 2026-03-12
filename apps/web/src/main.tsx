import { handleServerError } from "@/lib/handle-server-error";
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
import { DynamicAuthProvider } from "./context/dynamic-provider";
import { FontProvider } from "./context/font-provider";
import { ThemeProvider } from "./context/theme-provider";
import { hasAuthToken } from "./lib/api";
// Generated Routes
import { routeTree } from "./routeTree.gen";
// Styles
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Never retry auth errors — they won't resolve by retrying
        if (
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        ) {
          return false;
        }
        // Allow up to 2 retries for transient errors (same in dev & prod)
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
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
        if (error.response?.status === 401 && hasAuthToken()) {
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

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <DynamicAuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FontProvider>
              <DirectionProvider>
                <RouterProvider router={router} />
              </DirectionProvider>
            </FontProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </DynamicAuthProvider>
    </StrictMode>
  );
}
