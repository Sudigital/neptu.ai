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
    requestSignature,
    logout,
  } = useAuth();

  const hasWallet = !!walletAddress;
  const isConnected = !!wallet;
  const isLoggedIn = isAuthenticated;

  // Fetch user from DB when we have a wallet address and user is authenticated
  const {
    data,
    isPending: isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => neptuApi.getOrCreateUser(walletAddress),
    enabled: !!walletAddress && isLoggedIn,
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
    isLoggedIn,
    isConnected,
    isAuthenticated,
    isFullyAuthenticated,
    isAuthenticating,
    displayEmail,
    dynamicUser,
    showLogin,
    requestSignature,
    logout,
  };
}
