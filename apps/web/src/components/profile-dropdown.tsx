import { IconSolana, IconSudigital } from "@/assets/brand-icons";
import { Logo } from "@/assets/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { NEPTU_TOKEN, SOL_TOKEN, SUDIGITAL_TOKEN } from "@neptu/shared";
import { Link, useLocation } from "@tanstack/react-router";
import { Loader2, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileDropdown() {
  const { walletAddress, user, displayEmail, logout } = useUser();
  const { pathname } = useLocation();
  const {
    solBalance,
    neptuBalance,
    sudigitalBalance,
    pendingRewards,
    isLoading: balanceLoading,
  } = useWalletBalance();
  const t = useTranslate();
  const [copied, setCopied] = useState(false);

  const network = import.meta.env.VITE_SOLANA_NETWORK || "devnet";
  const isOnDashboard = pathname.startsWith("/dashboard");

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : displayEmail || "Connected";

  const userEmail = displayEmail || user?.email || "";
  const shortEmail =
    userEmail.length > 20
      ? `${userEmail.slice(0, 12)}...${userEmail.slice(userEmail.lastIndexOf("@"))}`
      : userEmail;

  const handleCopyAddress = () => {
    const textToCopy = walletAddress || displayEmail;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast.success(walletAddress ? t("user.walletCopied") : "Email copied!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await logout();
  };

  const displayName = shortAddress;
  let chainInfo = "connected";
  if (walletAddress) {
    chainInfo = `solana · ${network}`;
  } else if (displayEmail) {
    chainInfo = "email";
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-auto gap-2 px-0.5 py-1.5 sm:px-2.5"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/default.jpg" alt={displayName} />
            <AvatarFallback>
              <IconSolana className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start text-sm sm:flex">
            <span className="font-medium">{shortAddress}</span>
            <span className="text-xs text-muted-foreground">{chainInfo}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-none font-medium">{displayName}</p>
              {shortEmail && (
                <p className="text-xs leading-none text-muted-foreground">
                  {shortEmail}
                </p>
              )}
              <p className="text-xs leading-none text-muted-foreground">
                {chainInfo}
              </p>
            </div>
            {(walletAddress || displayEmail) && (
              <div className="flex items-center gap-1">
                {walletAddress && (
                  <a
                    href={`https://solscan.io/account/${walletAddress}${network === "mainnet" ? "" : `?cluster=${network}`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {walletAddress ? (
          <>
            <DropdownMenuLabel className="pb-1 text-xs font-normal text-muted-foreground">
              {t("user.balance", "Balance")}
            </DropdownMenuLabel>
            {balanceLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-0.5 px-2 pb-1">
                <div className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <IconSolana className="h-3 w-3" />
                    {SOL_TOKEN.SYMBOL}
                  </span>
                  <span className="font-mono font-medium">
                    {solBalance.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <IconSudigital className="h-3 w-3" />
                    {SUDIGITAL_TOKEN.SYMBOL}
                  </span>
                  <span className="font-mono font-medium">
                    {sudigitalBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Logo className="h-3 w-3" />
                    {NEPTU_TOKEN.SYMBOL}
                  </span>
                  <span className="font-mono font-medium">
                    {neptuBalance.toFixed(2)}
                  </span>
                </div>
                {pendingRewards > 0 && (
                  <div className="flex items-center justify-between rounded-md px-1.5 py-1 text-[10px]">
                    <span className="ml-4.5 text-muted-foreground/70">
                      + {pendingRewards.toFixed(2)}{" "}
                      {t("user.pending", "pending")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            {t("user.noWalletYet", "Wallet will be created automatically")}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {!isOnDashboard && (
            <DropdownMenuItem asChild>
              <Link to="/dashboard">
                {t("nav.dashboard")}
                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/settings">
              {t("settings.profile")}
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings/account">
              {t("settings.account")}
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              {t("nav.settings")}
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          {t("user.disconnect", "Disconnect")}
          <DropdownMenuShortcut className="text-current">
            ⇧⌘Q
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
