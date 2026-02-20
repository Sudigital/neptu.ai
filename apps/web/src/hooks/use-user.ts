import { useAuth } from "@/hooks/use-auth";
import { neptuApi, authenticateSession } from "@/lib/api";
import { useSettingsStore } from "@/stores/settings-store";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

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

  const [hasToken, setHasToken] = useState(false);
  const [authError, setAuthError] = useState(false);
  const authenticatedWallet = useRef<string | null>(null);

  // Authenticate with API when wallet connects (get signed access token)
  useEffect(() => {
    if (walletAddress && walletAddress !== authenticatedWallet.current) {
      setHasToken(false);
      setAuthError(false);
      authenticateSession(walletAddress)
        .then(() => {
          authenticatedWallet.current = walletAddress;
          setHasToken(true);
        })
        .catch(() => {
          authenticatedWallet.current = null;
          setHasToken(false);
          setAuthError(true);
        });
    }
    if (!walletAddress) {
      authenticatedWallet.current = null;
      setHasToken(false);
      setAuthError(false);
    }
  }, [walletAddress]);

  const hasWallet = !!walletAddress;
  const isConnected = !!wallet;
  const isLoggedIn = isAuthenticated;

  // Fetch user from DB once we have a signed token
  const queryEnabled = !!walletAddress && isLoggedIn && hasToken;
  const email = displayEmail || undefined;
  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => neptuApi.getOrCreateUser(walletAddress, email),
    enabled: queryEnabled,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Show loading while: SDK initializing, waiting for token, or fetching user
  // This prevents the birthday banner from flashing before data is available
  const isLoading =
    !ready ||
    (!!walletAddress && !isLoggedIn) ||
    (!!walletAddress && isLoggedIn && !hasToken && !authError) ||
    (queryEnabled && isPending && isFetching);

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
    hasToken,
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
