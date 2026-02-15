"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/features/admin/admin-api";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Table } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { type User } from "../data/schema";

type UserMultiDeleteDialogProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
};

const CONFIRM_WORD = "DELETE";

export function UsersMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: UserMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState("");
  const { walletAddress } = useUser();
  const queryClient = useQueryClient();

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const mutation = useMutation({
    mutationFn: async () => {
      const users = selectedRows.map((row) => row.original as User);
      await Promise.all(
        users.map((user) =>
          adminApi.updateUser(walletAddress!, user.id, { isAdmin: false })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      table.resetRowSelection();
      onOpenChange(false);
      toast.success(
        `Removed admin from ${selectedRows.length} ${
          selectedRows.length > 1 ? "users" : "user"
        }`
      );
    },
    onError: () => {
      toast.error("Failed to update users");
    },
  });

  const handleDelete = () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`);
      return;
    }
    mutation.mutate();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD || mutation.isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="me-1 inline-block stroke-destructive"
            size={18}
          />{" "}
          Remove admin from {selectedRows.length}{" "}
          {selectedRows.length > 1 ? "users" : "user"}
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to remove admin privileges from the selected
            users? <br />
            This action will revoke their admin access.
          </p>

          <Label className="my-4 flex flex-col items-start gap-1.5">
            <span className="">
              Confirm by typing &quot;{CONFIRM_WORD}&quot;:
            </span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
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
