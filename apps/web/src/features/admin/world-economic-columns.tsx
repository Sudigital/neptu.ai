import type { PersonTag } from "@neptu/shared";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PERSON_CATEGORY_LABELS, PERSON_TAG_LABELS } from "@neptu/shared";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal } from "lucide-react";

import type { FigureRow } from "./world-economic-parts";

import { CATEGORY_STYLES, SENTIMENT_ZONES } from "./world-economic-parts";

/* ── Helpers ─────────────────────────────────────────── */

function getSentimentColor(score: number): string {
  const zone = SENTIMENT_ZONES.find((z) => score >= z.min && score <= z.max);
  return zone?.color ?? "#eab308";
}

function getCategoryLabel(key: string): string {
  return (
    PERSON_CATEGORY_LABELS[key as keyof typeof PERSON_CATEGORY_LABELS] ?? key
  );
}

function getTagLabel(key: string): string {
  return PERSON_TAG_LABELS[key as keyof typeof PERSON_TAG_LABELS] ?? key;
}

/* ── Columns ─────────────────────────────────────────── */

export function createFigureColumns(
  onViewDetails: (id: string) => void
): ColumnDef<FigureRow>[] {
  return [
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.getValue("name")}</span>
          {row.original.profesi !== "—" && (
            <span className="max-w-[200px] truncate text-[11px] text-muted-foreground">
              {row.original.profesi}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "birthday",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Birthday" />
      ),
      cell: ({ row }) => {
        const age = row.original.age;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground tabular-nums">
              {row.getValue("birthday")}
            </span>
            {age !== null && (
              <span className="text-[11px] text-muted-foreground/70">
                Age {age}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "figureCategory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-0.5">
          {row.original.allCategories.map((c) => (
            <Badge key={c} variant="outline" className="text-[10px]">
              {getCategoryLabel(c)}
            </Badge>
          ))}
        </div>
      ),
      filterFn: (row, _id, value: string[]) =>
        row.original.allCategories.some((c) => value.includes(c)),
    },
    {
      accessorKey: "tags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tags" />
      ),
      cell: ({ row }) => {
        const tags = row.getValue("tags") as PersonTag[];
        if (!tags || tags.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex max-w-[200px] flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-[9px]"
              >
                {getTagLabel(tag)}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, _id, value: string[]) => {
        const tags = row.original.tags;
        return tags.some((t) => value.includes(t));
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Compatibility" />
      ),
      cell: ({ row }) => {
        const cat = row.getValue("category") as FigureRow["category"];
        if (!cat) return <span className="text-muted-foreground">—</span>;
        const style = CATEGORY_STYLES[cat];
        return (
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
              style.bg,
              style.text
            )}
          >
            {cat}
          </span>
        );
      },
      filterFn: (row, id, value: string[]) => {
        const cat = row.getValue(id) as string | null;
        return cat !== null && value.includes(cat);
      },
    },
    {
      accessorKey: "popularity",
      header: () => (
        <div className="text-center text-xs leading-tight">
          <div>Forbes</div>
          <div>Rank</div>
        </div>
      ),
      meta: { className: "text-center" },
      cell: ({ row }) => {
        const val = row.getValue("popularity") as number | null;
        return (
          <div className="text-center">
            {val !== null ? (
              <span className="font-semibold tabular-nums">#{val}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "uripPotensi",
      header: () => (
        <div className="text-center text-xs leading-tight">
          <div>Urip</div>
          <div>Potensi</div>
        </div>
      ),
      meta: { className: "text-center" },
      cell: ({ row }) => {
        const val = row.getValue("uripPotensi") as number | null;
        return (
          <div className="text-center">
            {val !== null ? (
              <span className="font-semibold tabular-nums">{val}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "uripPeluang",
      header: () => (
        <div className="text-center text-xs leading-tight">
          <div>Urip</div>
          <div>Peluang</div>
        </div>
      ),
      meta: { className: "text-center" },
      cell: ({ row }) => {
        const val = row.getValue("uripPeluang") as number | null;
        return (
          <div className="text-center">
            {val !== null ? (
              <span className="font-semibold tabular-nums">{val}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "dailyEnergy",
      header: () => (
        <div className="text-center text-xs leading-tight">
          <div>Daily</div>
          <div>Energy</div>
        </div>
      ),
      meta: { className: "text-center" },
      cell: ({ row }) => (
        <div className="text-center font-semibold tabular-nums">
          {row.getValue("dailyEnergy")}%
        </div>
      ),
    },
    {
      accessorKey: "sentimentIndex",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sentiment" />
      ),
      meta: { className: "text-center" },
      cell: ({ row }) => {
        const score = row.getValue("sentimentIndex") as number;
        return (
          <div
            className="text-center font-bold tabular-nums"
            style={{ color: getSentimentColor(score) }}
          >
            {score}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(row.original.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
