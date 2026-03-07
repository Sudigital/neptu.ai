import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cross2Icon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";
import { useMemo } from "react";

import { DataTableFacetedFilter } from "./faceted-filter";
import { DataTableViewOptions } from "./view-options";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: ComponentType<{ className?: string }>;
    }[];
    multiValueKey?: string;
  }[];
};

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Filter...",
  searchKey,
  filters = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter;

  const multiValueFacets = useMemo(() => {
    const result: Record<string, Map<string, number>> = {};
    const rows = table.getPreFilteredRowModel().rows;
    for (const f of filters) {
      if (!f.multiValueKey) continue;
      const counts = new Map<string, number>();
      for (const row of rows) {
        const values = (row.original as Record<string, unknown>)[
          f.multiValueKey
        ];
        if (Array.isArray(values)) {
          for (const v of values) {
            counts.set(v as string, (counts.get(v as string) ?? 0) + 1);
          }
        }
      }
      result[f.columnId] = counts;
    }
    return result;
  }, [table.getPreFilteredRowModel().rows, filters]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {searchKey ? (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        ) : (
          <Input
            placeholder={searchPlaceholder}
            value={table.getState().globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        <div className="flex gap-x-2">
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId);
            if (!column) return null;
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
                customFacets={multiValueFacets[filter.columnId]}
              />
            );
          })}
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ms-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
