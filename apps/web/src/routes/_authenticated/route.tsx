import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useAuth } from "@/hooks/use-auth";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { isAuthenticated, ready, isAuthenticating } = useAuth();

  if (!ready || isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <AuthenticatedLayout />;
}
