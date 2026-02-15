import { adminApi } from "@/features/admin/admin-api";
import { useDebounce } from "@/hooks/use-debounce";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ContentSection } from "../components/content-section";
import { PlansDialogs } from "./components/plans-dialogs";
import { PlansProvider } from "./components/plans-provider";
import { PlansTable } from "./components/plans-table";

const route = getRouteApi("/_authenticated/admin/settings/pricing-plans");

export function SettingsPricingPlans() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { walletAddress } = useUser();
  const debouncedSearch = useDebounce(search.search ?? "", 300);
  const searchQuery = debouncedSearch.length >= 3 ? debouncedSearch : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "plans",
      walletAddress,
      search.page,
      search.pageSize,
      searchQuery,
    ],
    queryFn: () =>
      adminApi.listPlans(walletAddress!, {
        page: search.page ?? 1,
        limit: search.pageSize ?? 10,
      }),
    enabled: !!walletAddress,
  });

  const plans = data?.data ?? [];

  return (
    <PlansProvider>
      <ContentSection
        title="Pricing Plans"
        desc="Manage API pricing plans."
        fullWidth
      >
        <PlansTable
          data={plans}
          pageCount={data?.totalPages ?? 0}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
        />
      </ContentSection>

      <PlansDialogs />
    </PlansProvider>
  );
}
