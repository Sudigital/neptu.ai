import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Activity, TrendingUp, Clock, Zap, Loader2 } from "lucide-react";
import { useState } from "react";

import { adminApi } from "./admin-api";

export function AdminAnalytics() {
  const [period, setPeriod] = useState("7d");

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
    }

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin", "analytics", period, startDate, endDate],
    queryFn: () =>
      adminApi.getUsageAnalytics({
        startDate,
        endDate,
        groupBy: period === "90d" ? "week" : "day",
      }),
  });

  const { data: endpoints, isLoading: endpointsLoading } = useQuery({
    queryKey: ["admin", "endpoints"],
    queryFn: () => adminApi.getTopEndpoints(),
  });

  const totalCalls =
    analytics?.analytics.reduce((sum, p) => sum + p.totalCalls, 0) ?? 0;
  const totalCredits =
    analytics?.analytics.reduce((sum, p) => sum + p.creditsUsed, 0) ?? 0;
  const avgDaily = analytics?.analytics.length
    ? Math.round(totalCalls / analytics.analytics.length)
    : 0;

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">API Analytics</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeSwitch />
            <div className="hidden sm:block">
              <ConfigDrawer />
            </div>
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main>
        {isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Calls
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : totalCalls.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      {
                        "7d": "Last 7 days",
                        "30d": "Last 30 days",
                        "90d": "Last 90 days",
                      }[period]
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Daily
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : avgDaily.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">calls per day</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Credits Used
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : totalCredits.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">total credits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    AI Calls
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading
                      ? "..."
                      : (
                          analytics?.analytics.reduce(
                            (sum, p) => sum + p.aiCalls,
                            0
                          ) ?? 0
                        ).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Oracle requests
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Usage Trend</CardTitle>
                  <CardDescription>API calls over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto">
                    {analyticsLoading && (
                      <div className="py-8 text-center text-muted-foreground">
                        Loading...
                      </div>
                    )}
                    {!analyticsLoading && analytics?.analytics.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                    {!analyticsLoading &&
                      (analytics?.analytics.length ?? 0) > 0 &&
                      analytics?.analytics.map((point) => (
                        <div
                          key={point.date}
                          className="flex items-center justify-between border-b py-1 last:border-0"
                        >
                          <span className="text-sm text-muted-foreground">
                            {point.date}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-sm">
                              {point.totalCalls} calls
                            </span>
                            <Badge variant="secondary" className="font-mono">
                              {point.aiCalls} AI
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Endpoints</CardTitle>
                  <CardDescription>Most popular API endpoints</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Avg Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endpointsLoading && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      )}
                      {!endpointsLoading &&
                        endpoints?.endpoints.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-muted-foreground"
                            >
                              No data available
                            </TableCell>
                          </TableRow>
                        )}
                      {!endpointsLoading &&
                        (endpoints?.endpoints.length ?? 0) > 0 &&
                        endpoints?.endpoints.slice(0, 10).map((ep, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-sm">
                              {ep.endpoint}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{ep.method}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {ep.totalCalls.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {ep.avgResponseTime}ms
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </Main>
    </>
  );
}
