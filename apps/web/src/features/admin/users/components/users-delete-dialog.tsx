"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/features/admin/admin-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { type User } from "../data/schema";

type UserDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: User;
};

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState("");
  const queryClient = useQueryClient();

  const confirmText = currentRow.walletAddress.slice(0, 8);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateUser(currentRow.id, {
        role: "user",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User has been removed from admin");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to remove user");
    },
  });

  const handleDelete = () => {
    if (value.trim() !== confirmText) return;
    mutation.mutate();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== confirmText || mutation.isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="me-1 inline-block stroke-destructive"
            size={18}
          />{" "}
          Remove User Admin
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to remove admin privileges from{" "}
            <span className="font-bold">
              {currentRow.displayName || currentRow.walletAddress}
            </span>
            ?
            <br />
            This will revoke their admin access.
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
              Please be careful, this operation will remove admin access.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={mutation.isPending ? "Removing..." : "Remove Admin"}
      destructive
    />
  );
}
