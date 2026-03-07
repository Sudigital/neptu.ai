import type { PersonDTO } from "@neptu/drizzle-orm";

import {
  DataTableBulkActions,
  DataTablePagination,
  DataTableToolbar,
} from "@/components/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PERSON_CATEGORY_LABELS, PERSON_TAG_LABELS } from "@neptu/shared";
import {
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { FigureRow } from "./world-economic-parts";

import { createFigureColumns } from "./world-economic-columns";
import { PersonDetailSheet } from "./world-economic-detail";

/* ── Filter Options ──────────────────────────────────── */

const FIGURE_CATEGORY_OPTIONS = Object.entries(PERSON_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TAG_OPTIONS = Object.entries(PERSON_TAG_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const COMPATIBILITY_OPTIONS = [
  { value: "mitra", label: "Mitra" },
  { value: "neutral", label: "Neutral" },
  { value: "satru", label: "Satru" },
];

const DEFAULT_PAGE_SIZE = 20;

/* ── Component ───────────────────────────────────────── */

type FigureDataTableProps = {
  data: FigureRow[];
  figures: PersonDTO[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (state: RowSelectionState) => void;
  onFilteredRowsChange?: (ids: string[]) => void;
};

export function FigureDataTable({
  data,
  figures,
  rowSelection,
  onRowSelectionChange,
  onFilteredRowsChange,
}: FigureDataTableProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonDTO | null>(null);

  const handleViewDetails = useCallback(
    (id: string) => {
      const person = figures.find((f) => f.id === id) ?? null;
      setSelectedPerson(person);
      setDetailOpen(true);
    },
    [figures]
  );

  const columns = useMemo(
    () => createFigureColumns(handleViewDetails),
    [handleViewDetails]
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "sentimentIndex", desc: true },
    { id: "dailyEnergy", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const name = String(row.getValue("name")).toLowerCase();
      const profesi = row.original.profesi.toLowerCase();
      const tags = row.original.tags.join(" ").toLowerCase();
      return (
        name.includes(search) ||
        profesi.includes(search) ||
        tags.includes(search)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  /* Report filtered row IDs whenever filters change */
  const filteredRows = table.getFilteredRowModel().rows;
  useEffect(() => {
    onFilteredRowsChange?.(filteredRows.map((r) => r.id));
  }, [filteredRows, onFilteredRowsChange]);

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        table={table}
        searchPlaceholder="Search by name or profesi..."
        filters={[
          {
            columnId: "figureCategory",
            title: "Category",
            options: FIGURE_CATEGORY_OPTIONS,
            multiValueKey: "allCategories",
          },
          {
            columnId: "tags",
            title: "Tags",
            options: TAG_OPTIONS,
            multiValueKey: "tags",
          },
          {
            columnId: "category",
            title: "Compatibility",
            options: COMPATIBILITY_OPTIONS,
          },
        ]}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(header.column.columnDef.meta?.className)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      <DataTableBulkActions table={table} entityName="person">
        <span />
      </DataTableBulkActions>
      <PersonDetailSheet
        person={selectedPerson}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
