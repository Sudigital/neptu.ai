import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";

import { activeStyles } from "../data/data";
import { type Plan } from "../data/schema";
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "tier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tier" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("tier")}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      const badgeColor = activeStyles.get(isActive);
      return (
        <Badge variant="outline" className={cn(badgeColor)}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "priceUsd",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price (USD)" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        ${(row.getValue("priceUsd") as number).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "billingPeriod",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Billing Period" />
    ),
    cell: ({ row }) => (
      <span className="text-sm capitalize">
        {row.getValue("billingPeriod")}
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
