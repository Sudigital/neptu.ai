"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/features/admin/admin-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Table } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { type Plan } from "../data/schema";

type PlansMultiCancelDialogProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
};

const CONFIRM_WORD = "CANCEL";

export function PlansMultiCancelDialog<TData>({
  open,
  onOpenChange,
  table,
}: PlansMultiCancelDialogProps<TData>) {
  const [value, setValue] = useState("");
  const queryClient = useQueryClient();

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const mutation = useMutation({
    mutationFn: async () => {
      const plans = selectedRows.map((row) => row.original as Plan);
      await Promise.all(
        plans.map((plan) => adminApi.updatePlan(plan.id, { isActive: false }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      table.resetRowSelection();
      onOpenChange(false);
      toast.success(
        `Cancelled ${selectedRows.length} ${
          selectedRows.length > 1 ? "plans" : "plan"
        }`
      );
    },
    onError: () => {
      toast.error("Failed to cancel plans");
    },
  });

  const handleConfirm = () => {
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
      handleConfirm={handleConfirm}
      disabled={value.trim() !== CONFIRM_WORD || mutation.isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="me-1 inline-block stroke-destructive"
            size={18}
          />{" "}
          Cancel {selectedRows.length}{" "}
          {selectedRows.length > 1 ? "plans" : "plan"}
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to cancel the selected plans? <br />
            This action cannot be undone.
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
              Please be careful, this operation cannot be undone.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={mutation.isPending ? "Cancelling..." : "Cancel Plans"}
      destructive
    />
  );
}
