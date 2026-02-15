import { DataTableBulkActions as BulkActionsToolbar } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Table } from "@tanstack/react-table";
import { XCircle } from "lucide-react";
import { useState } from "react";

import { PlansMultiCancelDialog } from "./plans-multi-delete-dialog";

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>;
};

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  return (
    <>
      <BulkActionsToolbar table={table} entityName="plan">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowCancelConfirm(true)}
              className="size-8"
              aria-label="Cancel selected plans"
              title="Cancel selected plans"
            >
              <XCircle />
              <span className="sr-only">Cancel selected plans</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cancel selected plans</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <PlansMultiCancelDialog
        table={table}
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
      />
    </>
  );
}
