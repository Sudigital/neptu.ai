import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/hooks/use-translate";

interface TokenBalanceProps {
  balance: number;
  rawBalance: string;
  walletAddress: string;
  pendingRewards?: number;
  onRefresh: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  className?: string;
  tokenSymbol?: string;
  tokenTitle?: string;
  iconClassName?: string;
}

const SOLANA_EXPLORER_BASE = "https://explorer.solana.com/address";

export function TokenBalance({
  balance,
  rawBalance,
  walletAddress,
  pendingRewards = 0,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  className,
  tokenSymbol = "NEPTU",
  tokenTitle,
  iconClassName,
}: TokenBalanceProps) {
  const t = useTranslate();
  const explorerUrl = `${SOLANA_EXPLORER_BASE}/${walletAddress}?cluster=devnet`;

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className={cn("h-5 w-5 text-primary", iconClassName)} />
              {tokenTitle ?? t("wallet.neptuBalance", "NEPTU Balance")}
            </CardTitle>
            <CardDescription>
              {t("wallet.tokenHoldings", "Your token holdings")}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main balance display */}
        <div className="text-center py-4">
          <p className="text-4xl font-bold">{balance.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            {tokenSymbol} ({t("wallet.onChain", "on-chain")})
          </p>
          {pendingRewards > 0 && (
            <p className="text-xs text-amber-500/70 mt-1">
              + {pendingRewards.toFixed(2)}{" "}
              {t("wallet.pendingRewards", "pending rewards")}
            </p>
          )}
        </div>

        {/* Raw balance (for debugging/transparency) */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs">
          <span className="text-muted-foreground">
            {t("wallet.rawBalance", "Raw balance (base units)")}
          </span>
          <span className="font-mono">{rawBalance}</span>
        </div>

        {/* Explorer link */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("wallet.viewExplorer", "View on Solana Explorer")}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
