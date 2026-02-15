import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import { cn } from "@/lib/utils";
import { NEPTU_TOKEN } from "@neptu/shared";
import { Loader2, TrendingUp, Flame, ArrowUpRight, Hash } from "lucide-react";

interface TokenStats {
  totalSolSpent: number;
  totalNeptuEarned: number;
  totalNeptuBurned: number;
  totalTransactions: number;
}

interface TokenStatsCardProps {
  stats: TokenStats | null;
  isLoading?: boolean;
  className?: string;
}

export function TokenStatsCard({
  stats,
  isLoading = false,
  className,
}: TokenStatsCardProps) {
  const t = useTranslate();

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      icon: <ArrowUpRight className="h-4 w-4 text-red-500" />,
      label: t("wallet.totalSolSpent"),
      value: `${(stats?.totalSolSpent ?? 0).toFixed(4)} SOL`,
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      label: t("wallet.totalNeptuEarned"),
      value: `${(stats?.totalNeptuEarned ?? 0).toFixed(2)} ${NEPTU_TOKEN.SYMBOL}`,
    },
    {
      icon: <Flame className="h-4 w-4 text-amber-500" />,
      label: t("wallet.totalNeptuBurned"),
      value: `${(stats?.totalNeptuBurned ?? 0).toFixed(2)} ${NEPTU_TOKEN.SYMBOL}`,
    },
    {
      icon: <Hash className="h-4 w-4 text-blue-500" />,
      label: t("wallet.totalTransactions"),
      value: String(stats?.totalTransactions ?? 0),
    },
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t("wallet.onChainStats")}
        </CardTitle>
        <CardDescription>{t("wallet.onChainStatsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-lg bg-muted/50 p-3"
            >
              {item.icon}
              <div>
                <p className="text-sm font-medium">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
