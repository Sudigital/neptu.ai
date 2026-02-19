import { useAuth } from "@/hooks/use-auth";
import { neptuApi, setWalletHeader } from "@/lib/api";
import { useSettingsStore } from "@/stores/settings-store";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

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
  } = useAuth();

  // Set wallet header for API calls (Dynamic SDK verifies wallet ownership)
  useEffect(() => {
    if (walletAddress) {
      setWalletHeader(walletAddress);
    }
  }, [walletAddress]);

  const hasWallet = !!walletAddress;
  const isConnected = !!wallet;
  const isLoggedIn = isAuthenticated;

  // Fetch user from DB when we have a wallet address and user is authenticated
  const queryEnabled = !!walletAddress && isLoggedIn;
  const email = displayEmail || undefined;
  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => neptuApi.getOrCreateUser(walletAddress, email),
    enabled: queryEnabled,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // isPending is true when enabled=false (no data yet), so only show
  // loading when we're actually fetching
  const isLoading = queryEnabled && isPending && isFetching;

  const isOnboarded = !!data?.user?.onboarded;
  const hasBirthDate = !!data?.user?.birthDate;

  // Sync preferredLanguage from DB to settings store
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  useEffect(() => {
    if (data?.user?.preferredLanguage) {
      setLanguage(data.user.preferredLanguage);
    }
  }, [data?.user?.preferredLanguage, setLanguage]);

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
  };
}
