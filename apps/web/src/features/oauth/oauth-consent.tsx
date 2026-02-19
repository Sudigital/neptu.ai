import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { OAUTH_SCOPE_DESCRIPTIONS, type OAuthScope } from "@neptu/shared";
import {
  useQuery,
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

import { oauthApi } from "./oauth-api";

interface ConsentSearchParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
}

interface ConsentData {
  consent: {
    client: {
      name: string;
      description?: string;
      logoUrl?: string;
    };
    requestedScopes: string[];
    redirectUri: string;
  };
}

function LoadingContent() {
  return (
    <CardContent className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </CardContent>
  );
}

function ErrorContent({ error }: { error: Error | null }) {
  return (
    <CardHeader className="text-center">
      <XCircle className="mx-auto h-12 w-12 text-destructive" />
      <CardTitle className="mt-4">Authorization Error</CardTitle>
      <CardDescription>
        {error instanceof Error
          ? error.message
          : "Could not load authorization details"}
      </CardDescription>
    </CardHeader>
  );
}

function ConsentContent({
  consentData,
  hasDecided,
  decisionMutation,
  onApprove,
  onDeny,
}: {
  consentData: ConsentData;
  hasDecided: boolean;
  decisionMutation: UseMutationResult<{ redirect?: string }, Error, boolean>;
  onApprove: () => void;
  onDeny: () => void;
}) {
  return (
    <>
      <CardHeader className="text-center">
        {consentData.consent.client.logoUrl ? (
          <img
            src={consentData.consent.client.logoUrl}
            alt={consentData.consent.client.name}
            className="mx-auto h-16 w-16 rounded-lg"
          />
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
            <ExternalLink className="h-8 w-8 text-primary" />
          </div>
        )}
        <CardTitle className="mt-4">
          {consentData.consent.client.name}
        </CardTitle>
        {consentData.consent.client.description && (
          <CardDescription>
            {consentData.consent.client.description}
          </CardDescription>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          wants access to your Neptu account
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="mb-3 text-sm font-medium">
            This application is requesting the following permissions:
          </p>
          <div className="space-y-3">
            {consentData.consent.requestedScopes.map((scope: string) => (
              <div
                key={scope}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div>
                  <Badge variant="secondary" className="mb-1">
                    {scope}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {OAUTH_SCOPE_DESCRIPTIONS[scope as OAuthScope] ?? scope}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            Redirect URI:{" "}
            <span className="font-mono">{consentData.consent.redirectUri}</span>
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onDeny}
          disabled={hasDecided || decisionMutation.isPending}
        >
          {decisionMutation.isPending && !decisionMutation.variables
            ? "..."
            : "Deny"}
        </Button>
        <Button
          className="flex-1"
          onClick={onApprove}
          disabled={hasDecided || decisionMutation.isPending}
        >
          {decisionMutation.isPending && decisionMutation.variables ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Authorize
        </Button>
      </CardFooter>

      {decisionMutation.isError && (
        <div className="px-6 pb-4">
          <p className="text-center text-sm text-destructive">
            {decisionMutation.error instanceof Error
              ? decisionMutation.error.message
              : "Authorization failed"}
          </p>
        </div>
      )}
    </>
  );
}

function CardContent_State({
  isLoading,
  error,
  consentData,
  hasDecided,
  decisionMutation,
  onApprove,
  onDeny,
}: {
  isLoading: boolean;
  error: Error | null;
  consentData: ConsentData | undefined;
  hasDecided: boolean;
  decisionMutation: UseMutationResult<{ redirect?: string }, Error, boolean>;
  onApprove: () => void;
  onDeny: () => void;
}) {
  if (isLoading) return <LoadingContent />;
  if (error) return <ErrorContent error={error} />;
  if (consentData) {
    return (
      <ConsentContent
        consentData={consentData}
        hasDecided={hasDecided}
        decisionMutation={decisionMutation}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );
  }
  return null;
}

export function OAuthConsentPage() {
  const search = useSearch({ strict: false }) as ConsentSearchParams;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hasDecided, setHasDecided] = useState(false);

  const {
    data: consentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["oauth", "consent", search.client_id, search.state],
    queryFn: () =>
      oauthApi.getConsentData({
        client_id: search.client_id,
        redirect_uri: search.redirect_uri,
        response_type: search.response_type,
        scope: search.scope,
        state: search.state,
        code_challenge: search.code_challenge,
        code_challenge_method: search.code_challenge_method,
      }),
    enabled:
      isAuthenticated &&
      Boolean(search.client_id) &&
      Boolean(search.redirect_uri),
    retry: false,
  });

  const decisionMutation = useMutation({
    mutationFn: (approved: boolean) =>
      oauthApi.submitConsent({
        client_id: search.client_id,
        redirect_uri: search.redirect_uri,
        scope: search.scope,
        state: search.state,
        code_challenge: search.code_challenge,
        code_challenge_method: search.code_challenge_method,
        approved,
      }),
    onSuccess: (result) => {
      if (result.redirect) {
        window.location.href = result.redirect;
      }
    },
  });

  const handleApprove = () => {
    setHasDecided(true);
    decisionMutation.mutate(true);
  };

  const handleDeny = () => {
    setHasDecided(true);
    decisionMutation.mutate(false);
  };

  if (!isAuthenticated) {
    return (
      <Main>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
              <CardTitle className="mt-4">Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to authorize this application.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button onClick={() => navigate({ to: "/" })}>Sign In</Button>
            </CardFooter>
          </Card>
        </div>
      </Main>
    );
  }

  if (!search.client_id || !search.redirect_uri) {
    return (
      <Main>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="mt-4">Invalid Request</CardTitle>
              <CardDescription>
                Missing required OAuth parameters. Check client_id and
                redirect_uri.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Main>
    );
  }

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Authorize Application</h1>
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
        <div className="flex min-h-[50vh] items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardContent_State
              isLoading={isLoading}
              error={error}
              consentData={consentData}
              hasDecided={hasDecided}
              decisionMutation={decisionMutation}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          </Card>
        </div>
      </Main>
    </>
  );
}
