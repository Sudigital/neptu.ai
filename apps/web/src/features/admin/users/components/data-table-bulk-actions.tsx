import { DataTableBulkActions as BulkActionsToolbar } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { adminApi } from "@/features/admin/admin-api";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Table } from "@tanstack/react-table";
import { Trash2, Shield, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { type User } from "../data/schema";
import { UsersMultiDeleteDialog } from "./users-multi-delete-dialog";

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>;
};

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const { walletAddress } = useUser();
  const queryClient = useQueryClient();

  const bulkAdminMutation = useMutation({
    mutationFn: async (isAdmin: boolean) => {
      const users = selectedRows.map((row) => row.original as User);
      await Promise.all(
        users.map((user) =>
          adminApi.updateUser(walletAddress!, user.id, { isAdmin })
        )
      );
    },
    onSuccess: (_data, isAdmin) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      table.resetRowSelection();
      const action = isAdmin ? "Promoted" : "Demoted";
      toast.success(
        `${action} ${selectedRows.length} user${selectedRows.length > 1 ? "s" : ""}`
      );
    },
    onError: () => {
      toast.error("Failed to update users");
    },
  });

  return (
    <>
      <BulkActionsToolbar table={table} entityName="user">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => bulkAdminMutation.mutate(true)}
              className="size-8"
              aria-label="Make selected users admin"
              title="Make selected users admin"
              disabled={bulkAdminMutation.isPending}
            >
              <Shield />
              <span className="sr-only">Make admin</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Make admin</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => bulkAdminMutation.mutate(false)}
              className="size-8"
              aria-label="Remove admin from selected users"
              title="Remove admin from selected users"
              disabled={bulkAdminMutation.isPending}
            >
              <ShieldOff />
              <span className="sr-only">Remove admin</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove admin</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="size-8"
              aria-label="Delete selected users"
              title="Delete selected users"
            >
              <Trash2 />
              <span className="sr-only">Delete selected users</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected users</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  );
}
