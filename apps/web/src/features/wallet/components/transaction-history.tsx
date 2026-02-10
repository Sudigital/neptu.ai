import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Flame,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/hooks/use-translate";

const SOLANA_TX_EXPLORER = "https://explorer.solana.com/tx";
const DEVNET_CLUSTER_PARAM = "?cluster=devnet";

interface Transaction {
  id: string;
  txSignature: string | null;
  transactionType: string;
  readingType: string | null;
  solAmount: number | null;
  neptuAmount: number | null;
  neptuRewarded: number | null;
  neptuBurned: number | null;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  description?: string | null;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
  className?: string;
}

const TX_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    colorClass: string;
  }
> = {
  sol_payment: {
    label: "SOL Payment",
    icon: <ArrowUpRight className="h-4 w-4" />,
    colorClass: "text-red-500",
  },
  neptu_payment: {
    label: "NEPTU Payment",
    icon: <ArrowUpRight className="h-4 w-4" />,
    colorClass: "text-orange-500",
  },
  neptu_reward: {
    label: "NEPTU Reward",
    icon: <ArrowDownRight className="h-4 w-4" />,
    colorClass: "text-green-500",
  },
  neptu_burn: {
    label: "NEPTU Burn",
    icon: <Flame className="h-4 w-4" />,
    colorClass: "text-amber-500",
  },
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> =
  {
    confirmed: "default",
    pending: "secondary",
    failed: "destructive",
  };

function formatTxSignature(sig: string | null): string {
  if (!sig) return "—";
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
}

function getExplorerUrl(txSignature: string): string {
  return `${SOLANA_TX_EXPLORER}/${txSignature}${DEVNET_CLUSTER_PARAM}`;
}

export function TransactionHistory({
  transactions,
  isLoading = false,
  className,
}: TransactionHistoryProps) {
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

  if (transactions.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>{t("wallet.transactions")}</CardTitle>
          <CardDescription>{t("wallet.transactionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ArrowUpRight className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("wallet.noTransactions")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("wallet.noTransactionsDesc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle>{t("wallet.transactions")}</CardTitle>
        <CardDescription>
          {transactions.length}{" "}
          {transactions.length === 1
            ? t("wallet.transaction")
            : t("wallet.transactionsLabel")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {transactions.map((tx) => {
            const typeConfig = TX_TYPE_CONFIG[tx.transactionType] || {
              label: tx.transactionType,
              icon: <ArrowUpRight className="h-4 w-4" />,
              colorClass: "text-muted-foreground",
            };

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full bg-background",
                      typeConfig.colorClass,
                    )}
                  >
                    {typeConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{typeConfig.label}</p>
                      {tx.readingType && (
                        <Badge variant="outline" className="text-xs">
                          {tx.readingType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {tx.txSignature ? (
                        <a
                          href={getExplorerUrl(tx.txSignature)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground transition-colors font-mono"
                        >
                          {formatTxSignature(tx.txSignature)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="font-mono">
                          {tx.description || "Pending"}
                        </span>
                      )}
                      <span>&middot;</span>
                      <span>
                        {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {tx.solAmount != null && tx.solAmount > 0 && (
                    <p className="text-sm font-medium text-red-500">
                      -{tx.solAmount} SOL
                    </p>
                  )}
                  {tx.neptuRewarded != null && tx.neptuRewarded > 0 && (
                    <p className="text-sm font-medium text-green-500">
                      +{tx.neptuRewarded} NEPTU
                    </p>
                  )}
                  {tx.neptuBurned != null && tx.neptuBurned > 0 && (
                    <p className="text-xs text-amber-500">
                      {tx.neptuBurned} burned
                    </p>
                  )}
                  <Badge
                    variant={STATUS_VARIANTS[tx.status] || "secondary"}
                    className="text-xs mt-1"
                  >
                    {tx.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
