import { Main } from "@/components/layout/main";
import { useUser } from "@/hooks/use-user";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <Main>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Main>
    );
  }

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
}
