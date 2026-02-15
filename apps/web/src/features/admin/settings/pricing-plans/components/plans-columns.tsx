import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";

import { statusStyles } from "../data/data";
import { type Plan, type PlanStatus } from "../data/schema";
import { DataTableRowActions } from "./data-table-row-actions";

function truncateId(id: string) {
  return `${id.slice(0, 8)}...`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const plansColumns: ColumnDef<Plan>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    meta: {
      className: cn("start-0 z-10 rounded-tl-[inherit] max-md:sticky"),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan ID" />
    ),
    cell: ({ row }) => (
      <code className="text-sm">{truncateId(row.getValue("id"))}</code>
    ),
    meta: {
      className: cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]",
        "start-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none"
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as PlanStatus;
      const badgeColor = statusStyles.get(status);
      return (
        <Badge variant="outline" className={cn("capitalize", badgeColor)}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "creditsRemaining",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Credits" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {(row.getValue("creditsRemaining") as number).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "aiCreditsRemaining",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="AI Credits" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {(row.getValue("aiCreditsRemaining") as number).toLocaleString()}
      </span>
    ),
  },
  {
    id: "billingCycle",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Billing Cycle" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">
        {formatDate(row.original.billingCycleStart)} –{" "}
        {formatDate(row.original.billingCycleEnd)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    cell: DataTableRowActions,
  },
];
