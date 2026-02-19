import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  RotateCcw,
  Shield,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { developerOAuthApi } from "../oauth-api";
import { CopyButton, SecretReveal } from "./secret-reveal";

const OAUTH_CLIENTS_KEY = ["developer", "oauth", "clients"];

export interface OAuthClientData {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  scopes: string[];
  grantTypes: string[];
  redirectUris: string[];
  isActive: boolean;
  isConfidential: boolean;
  createdAt: string;
}

export function OAuthClientCard({ client }: { client: OAuthClientData }) {
  const queryClient = useQueryClient();
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const rotateMutation = useMutation({
    mutationFn: () => developerOAuthApi.rotateSecret(client.id),
    onSuccess: (result) => {
      setNewSecret(result.client.clientSecret);
      queryClient.invalidateQueries({ queryKey: OAUTH_CLIENTS_KEY });
      toast.success("Client secret rotated");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to rotate secret"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => developerOAuthApi.deleteClient(client.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OAUTH_CLIENTS_KEY });
      toast.success("Client deleted");
      setDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete client"
      );
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{client.name}</CardTitle>
            {client.description && (
              <CardDescription>{client.description}</CardDescription>
            )}
          </div>
          <Badge variant={client.isActive ? "default" : "secondary"}>
            {client.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Client ID</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs break-all">
              {client.clientId}
            </code>
            <CopyButton text={client.clientId} />
          </div>
        </div>

        {newSecret && (
          <div className="space-y-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              New Secret — Copy it now
            </div>
            <SecretReveal secret={newSecret} />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {client.scopes.map((scope: string) => (
            <Badge key={scope} variant="outline" className="text-xs">
              {scope}
            </Badge>
          ))}
          {client.grantTypes.map((grant: string) => (
            <Badge key={grant} variant="secondary" className="text-xs">
              {grant}
            </Badge>
          ))}
          {client.isConfidential && (
            <Badge variant="secondary" className="text-xs">
              <Shield className="mr-1 h-3 w-3" />
              Confidential
            </Badge>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Redirect URIs</Label>
          <div className="mt-1 space-y-1">
            {client.redirectUris.map((uri: string) => (
              <code
                key={uri}
                className="block rounded bg-muted px-2 py-1 font-mono text-xs break-all"
              >
                {uri}
              </code>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => rotateMutation.mutate()}
            disabled={rotateMutation.isPending}
          >
            {rotateMutation.isPending ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-3 w-3" />
            )}
            Rotate Secret
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-3 w-3" />
                )}
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete OAuth Client</DialogTitle>
                <DialogDescription>
                  Delete &ldquo;{client.name}&rdquo;? This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-xs text-muted-foreground">
          Created {new Date(client.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
