import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { adminApi } from "@/features/admin/admin-api";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { SubscriptionsDialogs } from "./components/subscriptions-dialogs";
import { SubscriptionsProvider } from "./components/subscriptions-provider";
import { SubscriptionsTable } from "./components/subscriptions-table";

const route = getRouteApi("/_authenticated/admin/subscriptions");

export function Subscriptions() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const debouncedSearch = useDebounce(search.search ?? "", 300);
  const searchQuery = debouncedSearch.length >= 3 ? debouncedSearch : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "subscriptions",
      search.page,
      search.pageSize,
      searchQuery,
    ],
    queryFn: () =>
      adminApi.listSubscriptions({
        page: search.page ?? 1,
        limit: search.pageSize ?? 10,
      }),
  });

  const subscriptions = data?.data ?? [];

  return (
    <SubscriptionsProvider>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-3 sm:gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Subscription List
            </h2>
            <p className="text-muted-foreground">
              Manage API subscriptions here.
            </p>
          </div>
        </div>
        <SubscriptionsTable
          data={subscriptions}
          pageCount={data?.totalPages ?? 0}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
        />
      </Main>

      <SubscriptionsDialogs />
    </SubscriptionsProvider>
  );
}
