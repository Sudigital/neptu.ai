import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { formatCompactCurrency, WORKER_BASE_URL } from "./world-economic-parts";

/* ── Types ───────────────────────────────────────────── */

interface WealthMover {
  name: string;
  changeBillions: number;
  netWorthBillions: number;
  rank: number;
  country: string | null;
  imageUrl: string | null;
}

interface WealthFlowResponse {
  success: boolean;
  billionaireCount: number;
  totalDailyChange: number;
  totalNetWorth: number;
  topGainers: WealthMover[];
  topLosers: WealthMover[];
}

/* ── Constants ───────────────────────────────────────── */

const REFETCH_INTERVAL = 1_800_000;
const STALE_TIME = 900_000;

/* ── Helpers ─────────────────────────────────────────── */

function formatChangeBillions(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}$${Math.abs(value).toFixed(1)}B`;
}

/* ── Sub-components ──────────────────────────────────── */

function MoverRow({
  mover,
  variant,
}: {
  mover: WealthMover;
  variant: "gainer" | "loser";
}) {
  const isPositive =
    variant === "gainer" ? mover.changeBillions >= 0 : mover.changeBillions > 0;
  const Icon = variant === "gainer" ? ArrowUp : ArrowDown;
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-2 overflow-hidden">
        {mover.imageUrl ? (
          <img
            src={mover.imageUrl}
            alt={mover.name}
            className="h-6 w-6 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
            {mover.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{mover.name}</div>
          <div className="text-[10px] text-muted-foreground">
            #{mover.rank} · ${mover.netWorthBillions.toFixed(1)}B
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-0.5 text-xs font-bold",
          isPositive ? "text-emerald-600" : "text-red-500"
        )}
      >
        <Icon className="h-3 w-3" />
        {formatChangeBillions(mover.changeBillions)}
      </div>
    </div>
  );
}

function SummaryKpi({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2",
        className
      )}
    >
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */

export function WealthFlowWidget() {
  const { data, isLoading } = useQuery<WealthFlowResponse>({
    queryKey: ["wealth-flow"],
    queryFn: async () => {
      const res = await fetch(`${WORKER_BASE_URL}/api/crypto/wealth-flow`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<WealthFlowResponse>;
    },
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">
            Loading wealth flow...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!data?.success) return null;

  const isPositiveDay = data.totalDailyChange >= 0;
  const sentiment = isPositiveDay ? "Risk-On" : "Risk-Off";
  const sentimentColor = isPositiveDay ? "text-emerald-600" : "text-red-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Forbes Wealth Flow</CardTitle>
            <CardDescription className="text-[10px]">
              Top {data.billionaireCount} billionaires · real-time daily change
            </CardDescription>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              isPositiveDay
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
            )}
          >
            {isPositiveDay ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {sentiment}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* KPI Summary Row */}
        <div className="grid grid-cols-3 gap-2">
          <SummaryKpi
            label="Daily Change"
            value={formatChangeBillions(data.totalDailyChange)}
            icon={
              isPositiveDay ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )
            }
            className={
              isPositiveDay
                ? "border-emerald-200 dark:border-emerald-800/40"
                : "border-red-200 dark:border-red-800/40"
            }
          />
          <SummaryKpi
            label="Total Net Worth"
            value={formatCompactCurrency(data.totalNetWorth * 1_000_000_000)}
            icon={<DollarSign className="h-3 w-3" />}
          />
          <SummaryKpi
            label="Tracked"
            value={`${data.billionaireCount}`}
            icon={<Users className="h-3 w-3" />}
          />
        </div>

        {/* Top Movers */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Top Gainers */}
          <div>
            <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              Top Gainers
            </div>
            <div className="divide-y">
              {data.topGainers.map((m) => (
                <MoverRow key={m.name} mover={m} variant="gainer" />
              ))}
            </div>
          </div>
          {/* Top Losers */}
          <div>
            <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-red-500">
              <TrendingDown className="h-3 w-3" />
              Top Losers
            </div>
            <div className="divide-y">
              {data.topLosers.map((m) => (
                <MoverRow key={m.name} mover={m} variant="loser" />
              ))}
            </div>
          </div>
        </div>

        {/* Macro Signal Bar */}
        <div className="flex items-center justify-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-[10px]">
          <span className="text-muted-foreground">
            Billionaire capital flow:
          </span>
          <span className={cn("font-bold", sentimentColor)}>
            {formatChangeBillions(data.totalDailyChange)}
          </span>
          <span className="text-muted-foreground">today →</span>
          <span className={cn("font-semibold", sentimentColor)}>
            {sentiment}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
