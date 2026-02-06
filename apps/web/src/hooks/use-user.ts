import { useQuery } from "@tanstack/react-query";
import { neptuApi } from "@/lib/api";
import { useWallet } from "./use-wallet";

export function useUser() {
  const { walletAddress, hasWallet, ready } = useWallet();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => neptuApi.getOrCreateUser(walletAddress),
    enabled: hasWallet,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    user: data?.user,
    walletAddress,
    hasWallet,
    ready,
    isOnboarded: data?.user?.onboarded ?? false,
    needsOnboarding: data?.user && !data.user.onboarded,
  };
}
