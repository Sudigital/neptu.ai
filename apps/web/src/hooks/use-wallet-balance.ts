import { useUser } from "@/hooks/use-user";
import { neptuApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const BALANCE_STALE_TIME = 30_000;
const BALANCE_REFETCH_INTERVAL = 60_000;

export function useWalletBalance() {
  const { walletAddress, hasToken } = useUser();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["walletBalances", walletAddress],
    queryFn: () => neptuApi.getWalletBalances(walletAddress),
    enabled: !!walletAddress && hasToken,
    staleTime: BALANCE_STALE_TIME,
    refetchInterval: BALANCE_REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
  });

  return {
    solBalance: data?.sol?.formatted ?? 0,
    neptuBalance: data?.neptu?.formatted ?? 0,
    sudigitalBalance: data?.sudigital?.formatted ?? 0,
    pendingRewards: data?.pendingRewards ?? 0,
    isLoading,
    isError,
    isFetching,
    refetch,
  };
}
