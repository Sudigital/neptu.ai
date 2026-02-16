import { neptuApi } from "@/lib/api";
import {
  useDynamicContext,
  useIsLoggedIn,
  useAuthenticateConnectedUser,
} from "@dynamic-labs/sdk-react-core";
import { useQuery } from "@tanstack/react-query";

export function useUser() {
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const { authenticateUser, isAuthenticating } = useAuthenticateConnectedUser();

  const walletAddress = primaryWallet?.address ?? "";
  const ready = sdkHasLoaded;
  const isSolana = primaryWallet?.chain === "SOL";
  const hasWallet = !!walletAddress && isSolana;
  const isConnected = !!primaryWallet;

  // Fetch user from DB only when fully authenticated
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
    wallet: primaryWallet ?? null,
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
    isAuthenticating,
    authenticateUser,
  };
}
