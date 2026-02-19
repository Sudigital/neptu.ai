import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  OAUTH_GRANT_TYPES,
  OAUTH_SCOPES,
  OAUTH_SCOPE_DESCRIPTIONS,
  type OAuthScope,
} from "@neptu/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { developerOAuthApi } from "../oauth-api";
import { SecretReveal } from "./secret-reveal";

const OAUTH_CLIENTS_KEY = ["developer", "oauth", "clients"];

export function CreateClientDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [redirectUris, setRedirectUris] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "neptu:read",
  ]);
  const [selectedGrants, setSelectedGrants] = useState<string[]>([
    "authorization_code",
    "refresh_token",
  ]);
  const [isConfidential, setIsConfidential] = useState(true);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      developerOAuthApi.createClient({
        name,
        description: description || undefined,
        redirectUris: redirectUris
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
        scopes: selectedScopes,
        grantTypes: selectedGrants,
        isConfidential,
      }),
    onSuccess: (result) => {
      setCreatedSecret(result.client.clientSecret);
      queryClient.invalidateQueries({ queryKey: OAUTH_CLIENTS_KEY });
      toast.success("OAuth client created");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create client"
      );
    },
  });

  const handleClose = () => {
    setOpen(false);
    setName("");
    setDescription("");
    setRedirectUris("");
    setSelectedScopes(["neptu:read"]);
    setSelectedGrants(["authorization_code", "refresh_token"]);
    setIsConfidential(true);
    setCreatedSecret(null);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const toggleGrant = (grant: string) => {
    setSelectedGrants((prev) =>
      prev.includes(grant) ? prev.filter((g) => g !== grant) : [...prev, grant]
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {createdSecret ? (
          <CreatedSecretView secret={createdSecret} onClose={handleClose} />
        ) : (
          <CreateClientForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            redirectUris={redirectUris}
            setRedirectUris={setRedirectUris}
            selectedScopes={selectedScopes}
            toggleScope={toggleScope}
            selectedGrants={selectedGrants}
            toggleGrant={toggleGrant}
            isConfidential={isConfidential}
            setIsConfidential={setIsConfidential}
            isPending={createMutation.isPending}
            onSubmit={() => createMutation.mutate()}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatedSecretView({
  secret,
  onClose,
}: {
  secret: string;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Client Created Successfully</DialogTitle>
        <DialogDescription>
          Copy the client secret now. It will not be shown again.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            Store this secret securely
          </div>
        </div>
        <Label>Client Secret</Label>
        <SecretReveal secret={secret} />
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  );
}

interface CreateClientFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  redirectUris: string;
  setRedirectUris: (v: string) => void;
  selectedScopes: string[];
  toggleScope: (s: string) => void;
  selectedGrants: string[];
  toggleGrant: (g: string) => void;
  isConfidential: boolean;
  setIsConfidential: (v: boolean) => void;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function CreateClientForm({
  name,
  setName,
  description,
  setDescription,
  redirectUris,
  setRedirectUris,
  selectedScopes,
  toggleScope,
  selectedGrants,
  toggleGrant,
  isConfidential,
  setIsConfidential,
  isPending,
  onSubmit,
  onCancel,
}: CreateClientFormProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create OAuth Client</DialogTitle>
        <DialogDescription>
          Register a new OAuth application to access Neptu APIs.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="client-name">Application Name</Label>
          <Input
            id="client-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Application"
          />
        </div>
        <div>
          <Label htmlFor="client-desc">Description (optional)</Label>
          <Textarea
            id="client-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this application do?"
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="redirect-uris">Redirect URIs (one per line)</Label>
          <Textarea
            id="redirect-uris"
            value={redirectUris}
            onChange={(e) => setRedirectUris(e.target.value)}
            placeholder={
              "https://example.com/callback\nhttp://localhost:3000/callback"
            }
            rows={3}
            className="font-mono text-xs"
          />
        </div>
        <div>
          <Label>Scopes</Label>
          <div className="mt-2 space-y-2">
            {OAUTH_SCOPES.map((scope) => (
              <label
                key={scope}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedScopes.includes(scope)}
                  onChange={() => toggleScope(scope)}
                  className="rounded"
                />
                <div>
                  <Badge variant="secondary" className="mb-0.5">
                    {scope}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {OAUTH_SCOPE_DESCRIPTIONS[scope as OAuthScope]}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Grant Types</Label>
          <div className="mt-2 space-y-2">
            {OAUTH_GRANT_TYPES.map((grant) => (
              <label
                key={grant}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedGrants.includes(grant)}
                  onChange={() => toggleGrant(grant)}
                  className="rounded"
                />
                <span className="text-sm">{grant}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>Confidential Client</Label>
            <p className="text-xs text-muted-foreground">
              Server-side app that can securely store secrets
            </p>
          </div>
          <Switch
            checked={isConfidential}
            onCheckedChange={setIsConfidential}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={
            isPending ||
            !name.trim() ||
            !redirectUris.trim() ||
            selectedScopes.length === 0
          }
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create
        </Button>
      </DialogFooter>
    </>
  );
}
