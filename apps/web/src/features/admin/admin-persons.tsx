import type { RowSelectionState } from "@tanstack/react-table";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { adminApi } from "./admin-api";
import { MarketSentimentGauge } from "./world-economic-components";
import {
  computeFigureRows,
  computeMarketSentiment,
  MAX_PERSONS,
  PP_REFETCH_INTERVAL,
} from "./world-economic-parts";
import { FigureDataTable } from "./world-economic-table";

export function AdminPersons() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filteredIds, setFilteredIds] = useState<string[]>([]);

  const { data: figuresData, isLoading } = useQuery({
    queryKey: ["admin", "persons", "all"],
    queryFn: () =>
      adminApi.listPersons({ limit: MAX_PERSONS, status: "active" }),
    refetchInterval: PP_REFETCH_INTERVAL,
  });

  const figures = figuresData?.data ?? [];

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );

  const handleFilteredRowsChange = useCallback(
    (ids: string[]) => setFilteredIds(ids),
    []
  );

  const isFiltered =
    filteredIds.length > 0 && filteredIds.length < figures.length;

  const sentimentFigures = useMemo(() => {
    if (selectedIds.length > 0) {
      const idSet = new Set(selectedIds);
      return figures.filter((f) => idSet.has(f.id));
    }
    if (isFiltered) {
      const idSet = new Set(filteredIds);
      return figures.filter((f) => idSet.has(f.id));
    }
    return figures;
  }, [figures, selectedIds, isFiltered, filteredIds]);

  const sentiment = useMemo(
    () =>
      sentimentFigures.length > 0
        ? computeMarketSentiment(sentimentFigures)
        : null,
    [sentimentFigures]
  );

  const hasSelection = selectedIds.length > 0 || isFiltered;

  const handleRowSelectionChange = useCallback(
    (state: RowSelectionState) => setRowSelection(state),
    []
  );

  const figureRows = useMemo(
    () => (figures.length > 0 ? computeFigureRows(figures) : []),
    [figures]
  );

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Persons</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main>
        <div className="space-y-6">
          {/* Sentiment summary */}
          {sentiment && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MarketSentimentGauge
                sentiment={sentiment}
                isFiltered={hasSelection}
                totalCount={figures.length}
              />
            </div>
          )}

          {/* People Data Table */}
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loading persons...
            </div>
          ) : (
            figureRows.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">People Analysis</CardTitle>
                  <CardDescription className="text-xs">
                    Neptu astrology analysis for all {figureRows.length}{" "}
                    powerful people — sorted by sentiment and daily energy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FigureDataTable
                    data={figureRows}
                    figures={figures}
                    rowSelection={rowSelection}
                    onRowSelectionChange={handleRowSelectionChange}
                    onFilteredRowsChange={handleFilteredRowsChange}
                  />
                </CardContent>
              </Card>
            )
          )}
        </div>
      </Main>
    </>
  );
}
