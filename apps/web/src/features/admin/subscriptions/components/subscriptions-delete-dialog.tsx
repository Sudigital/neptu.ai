"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/features/admin/admin-api";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { type Subscription } from "../data/schema";

type SubscriptionCancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Subscription;
};

export function SubscriptionsCancelDialog({
  open,
  onOpenChange,
  currentRow,
}: SubscriptionCancelDialogProps) {
  const [value, setValue] = useState("");
  const { walletAddress } = useUser();
  const queryClient = useQueryClient();

  const confirmText = currentRow.id.slice(0, 8);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateSubscription(walletAddress!, currentRow.id, {
        status: "cancelled",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      toast.success("Subscription has been cancelled");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to cancel subscription");
    },
  });

  const handleConfirm = () => {
    if (value.trim() !== confirmText) return;
    mutation.mutate();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleConfirm}
      disabled={value.trim() !== confirmText || mutation.isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="me-1 inline-block stroke-destructive"
            size={18}
          />{" "}
          Cancel Subscription
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to cancel subscription{" "}
            <span className="font-mono font-bold">
              {currentRow.id.slice(0, 8)}...
            </span>
            ?
            <br />
            This will revoke access immediately.
          </p>

          <Label className="my-2">
            Type <span className="font-mono font-bold">{confirmText}</span> to
            confirm:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${confirmText}" to confirm.`}
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation cannot be undone.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={mutation.isPending ? "Cancelling..." : "Cancel Subscription"}
      destructive
    />
  );
}
