import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { adminApi } from "@/features/admin/admin-api";
import { useDebounce } from "@/hooks/use-debounce";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { UsersDialogs } from "./components/users-dialogs";
import { UsersProvider } from "./components/users-provider";
import { UsersTable } from "./components/users-table";

const route = getRouteApi("/_authenticated/admin/users");

export function Users() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { walletAddress } = useUser();
  const debouncedSearch = useDebounce(search.search ?? "", 300);
  const searchQuery = debouncedSearch.length >= 3 ? debouncedSearch : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "users",
      walletAddress,
      search.page,
      search.pageSize,
      searchQuery,
    ],
    queryFn: () =>
      adminApi.listUsers(walletAddress!, {
        page: search.page ?? 1,
        limit: search.pageSize ?? 10,
        search: searchQuery,
      }),
    enabled: !!walletAddress,
  });

  const users = data?.data ?? [];

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User List</h2>
            <p className="text-muted-foreground">
              Manage your users and their roles here.
            </p>
          </div>
        </div>
        <UsersTable
          data={users}
          pageCount={data?.totalPages ?? 0}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
        />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  );
}
