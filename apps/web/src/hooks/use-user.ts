import { useAuth } from "@/hooks/use-auth";
import { neptuApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function useUser() {
  const {
    walletAddress,
    wallet,
    ready,
    isAuthenticated,
    isFullyAuthenticated,
    isAuthenticating,
    displayEmail,
    dynamicUser,
    showLogin,
    signIn,
    logout,
    user: pasetoUser,
  } = useAuth();

  const hasWallet = !!walletAddress;
  const isConnected = !!wallet;
  const isLoggedIn = isAuthenticated;

  // Fetch user from DB when we have a wallet address and user is authenticated
  const queryEnabled = !!walletAddress && isLoggedIn;
  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => neptuApi.getOrCreateUser(walletAddress),
    enabled: queryEnabled,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // isPending is true when enabled=false (no data yet), so only show
  // loading when we're actually fetching
  const isLoading = queryEnabled && isPending && isFetching;

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
    isLoggedIn,
    isConnected,
    isAuthenticated,
    isFullyAuthenticated,
    isAuthenticating,
    displayEmail,
    dynamicUser,
    showLogin,
    signIn,
    logout,
    pasetoUser,
  };
}
