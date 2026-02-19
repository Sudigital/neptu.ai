import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Key, Loader2 } from "lucide-react";

import {
  CreateClientDialog,
  OAuthClientCard,
  type OAuthClientData,
} from "./components";
import { developerOAuthApi } from "./oauth-api";

const OAUTH_CLIENTS_KEY = ["developer", "oauth", "clients"];

function LoadingState() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ErrorState({ error }: { error: Error | null }) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load OAuth clients"}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Key className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No OAuth clients yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first OAuth client to start integrating with Neptu.
        </p>
        <div className="mt-4">
          <CreateClientDialog />
        </div>
      </CardContent>
    </Card>
  );
}

function ClientList({ clients }: { clients: Array<Record<string, unknown>> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {clients.map((client) => (
        <OAuthClientCard
          key={client.id as string}
          client={client as unknown as OAuthClientData}
        />
      ))}
    </div>
  );
}

function PortalContent({
  isLoading,
  error,
  clients,
}: {
  isLoading: boolean;
  error: Error | null;
  clients: Array<Record<string, unknown>> | undefined;
}) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!clients || clients.length === 0) return <EmptyState />;
  return <ClientList clients={clients} />;
}

export function DeveloperOAuthPortal() {
  const {
    data: clientsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: OAUTH_CLIENTS_KEY,
    queryFn: () => developerOAuthApi.listClients(),
  });

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <h1 className="text-lg font-semibold">OAuth Applications</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeSwitch />
            <div className="hidden sm:block">
              <ConfigDrawer />
            </div>
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your OAuth Clients</h2>
            <p className="text-sm text-muted-foreground">
              Manage OAuth applications that access Neptu APIs on behalf of
              users.
            </p>
          </div>
          <CreateClientDialog />
        </div>

        <PortalContent
          isLoading={isLoading}
          error={error}
          clients={clientsData?.clients}
        />
      </Main>
    </>
  );
}
