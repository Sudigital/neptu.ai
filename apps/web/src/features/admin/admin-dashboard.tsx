import type { ElementType } from "react";

import { ConfigDrawer } from "@/components/config-drawer";
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
import {
  Users,
  Key,
  Activity,
  DollarSign,
  TrendingUp,
  BookOpen,
  Zap,
  Loader2,
} from "lucide-react";

import { adminApi } from "./admin-api";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ElementType;
  trend?: { value: number; label: string };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs text-green-600">
            <TrendingUp className="mr-1 h-3 w-3" />+{trend.value} {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30000,
  });

  return (
    <>
      <Header fixed>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={isLoading ? "..." : (stats?.stats.users.total ?? 0)}
                description={`${stats?.stats.users.onboarded ?? 0} onboarded`}
                icon={Users}
                trend={
                  stats?.stats.users.todayNew
                    ? { value: stats.stats.users.todayNew, label: "today" }
                    : undefined
                }
              />
              <StatCard
                title="Active Subscriptions"
                value={
                  isLoading ? "..." : (stats?.stats.subscriptions.active ?? 0)
                }
                description={`${stats?.stats.subscriptions.total ?? 0} total`}
                icon={Key}
              />
              <StatCard
                title="API Calls Today"
                value={isLoading ? "..." : (stats?.stats.usage.todayCalls ?? 0)}
                description={`${stats?.stats.usage.totalCalls ?? 0} total`}
                icon={Activity}
              />
              <StatCard
                title="Total Readings"
                value={isLoading ? "..." : (stats?.stats.readings.total ?? 0)}
                description={`${stats?.stats.readings.todayNew ?? 0} today`}
                icon={BookOpen}
                trend={
                  stats?.stats.readings.todayNew
                    ? { value: stats.stats.readings.todayNew, label: "today" }
                    : undefined
                }
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Reading Breakdown</CardTitle>
                  <CardDescription>Distribution by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Potensi
                      </span>
                      <span className="font-medium">
                        {stats?.stats.readings.potensi ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Peluang
                      </span>
                      <span className="font-medium">
                        {stats?.stats.readings.peluang ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Compatibility
                      </span>
                      <span className="font-medium">
                        {stats?.stats.readings.compatibility ?? 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>Current breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <Zap className="h-3 w-3 text-green-500" />
                        Active
                      </span>
                      <span className="font-medium">
                        {stats?.stats.subscriptions.active ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        Cancelled
                      </span>
                      <span className="font-medium">
                        {stats?.stats.subscriptions.cancelled ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        Expired
                      </span>
                      <span className="font-medium">
                        {stats?.stats.subscriptions.expired ?? 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Performance</CardTitle>
                  <CardDescription>Usage metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {stats?.stats.usage.avgResponseTime ?? 0}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Response Time
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {stats?.stats.usage.totalCreditsUsed?.toLocaleString() ??
                          0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Credits Used
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {stats?.stats.users.admins ?? 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Admin Users
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </Main>
    </>
  );
}
