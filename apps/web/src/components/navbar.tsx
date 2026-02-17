import { Logo } from "@/assets/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Wallet,
  ChevronDown,
  Coins,
  Sparkles,
  ExternalLink,
  Menu,
  FileText,
  Home,
  ArrowLeftRight,
  Tag,
} from "lucide-react";
import React, { useState } from "react";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

interface CryptoItem {
  symbol: string;
  name: string;
  image?: string;
}

export function Navbar() {
  const { isAuthenticated, isAuthenticating, showLogin } = useUser();
  const t = useTranslate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: cryptos } = useQuery<CryptoItem[]>({
    queryKey: ["crypto-market"],
    queryFn: async () => {
      const response = await fetch(`${WORKER_URL}/api/crypto/market`);
      if (!response.ok) throw new Error("Failed to fetch crypto data");
      const json = await response.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[280px] flex-col p-0 sm:w-[320px]"
              aria-describedby={undefined}
            >
              <SheetHeader className="p-4 pb-0">
                <SheetTitle className="flex items-center gap-2">
                  <Logo className="h-6 w-6 text-primary" />
                  <span>Neptu</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-4">
                <SheetClose asChild>
                  <Link
                    to="/"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {t("nav.home") || "Home"}
                    </span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/cryptos"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <Coins className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {t("nav.cryptoBirthdays")}
                    </span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t("nav.pricing")}</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/p2p"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t("nav.p2pTrading")}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto border-amber-500 text-[10px] text-amber-500"
                    >
                      {t("nav.soon")}
                    </Badge>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <a
                    href="https://docs.neptu.sudigital.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t("nav.docs")}</span>
                    <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                  </a>
                </SheetClose>

                {/* Crypto List in Mobile Menu */}
                {cryptos && cryptos.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {t("nav.topCryptos")}
                    </p>
                    {cryptos.slice(0, 8).map((crypto) => (
                      <SheetClose key={crypto.symbol} asChild>
                        <Link
                          to="/cryptos/$symbol"
                          params={{ symbol: crypto.symbol.toLowerCase() }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                        >
                          {crypto.image ? (
                            <img
                              src={crypto.image}
                              alt={crypto.name}
                              className="h-5 w-5 rounded-full"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs">
                              {crypto.symbol.slice(0, 2)}
                            </div>
                          )}
                          <span className="flex-1 text-sm">{crypto.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {crypto.symbol}
                          </span>
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Link
                        to="/cryptos"
                        className="mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:underline"
                      >
                        {t("nav.viewAllCryptos").replace(
                          "{{count}}",
                          String(cryptos.length)
                        )}
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </nav>

              {/* Theme & Language in Sidebar Footer */}
              <div className="mt-auto border-t p-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">
                    {t("nav.theme")}
                  </span>
                  <ThemeSwitch />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">
                    {t("nav.language")}
                  </span>
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              Neptu
            </span>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            <Link
              to="/p2p"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {t("nav.p2p")}
              <Badge
                variant="outline"
                className="border-amber-500 px-1 py-0 text-[9px] text-amber-500"
              >
                {t("nav.soon")}
              </Badge>
            </Link>
            {cryptos && cryptos.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                    <Coins className="h-4 w-4" />
                    {t("nav.cryptos")}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-80 w-56 overflow-y-auto"
                >
                  <DropdownMenuLabel>
                    <Link
                      to="/cryptos"
                      className="flex w-full items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {t("nav.allCryptoBirthdays")}
                    </Link>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {cryptos.slice(0, 15).map((crypto) => (
                    <DropdownMenuItem key={crypto.symbol} asChild>
                      <Link
                        to="/cryptos/$symbol"
                        params={{ symbol: crypto.symbol.toLowerCase() }}
                        className="flex w-full cursor-pointer items-center gap-2"
                      >
                        {crypto.image ? (
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="h-5 w-5 rounded-full"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs">
                            {crypto.symbol.slice(0, 2)}
                          </div>
                        )}
                        <span className="flex-1">{crypto.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {crypto.symbol}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {cryptos.length > 15 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/cryptos"
                          className="flex w-full items-center justify-center gap-2 text-primary"
                        >
                          {t("nav.viewAllCryptos").replace(
                            "{{count}}",
                            String(cryptos.length)
                          )}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/cryptos"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <Coins className="h-4 w-4" />
                {t("nav.cryptos")}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/pricing"
            className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:flex"
          >
            <Tag className="h-4 w-4" />
            {t("nav.pricing")}
          </Link>
          <a
            href="https://docs.neptu.sudigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:flex"
          >
            <FileText className="h-4 w-4" />
            {t("nav.docs")}
          </a>
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <div className="hidden md:block">
            <ThemeSwitch />
          </div>
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : isAuthenticating ? (
            <Button
              disabled
              className="h-9 bg-[#7C3AED] px-2.5 text-xs text-white hover:bg-[#7C3AED]/90 sm:px-4 sm:text-sm"
            >
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t("landing.connecting")}
            </Button>
          ) : (
            <Button
              onClick={showLogin}
              className="h-9 bg-[#7C3AED] px-2.5 text-xs text-white hover:bg-[#7C3AED]/90 sm:px-4 sm:text-sm"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {t("landing.connectWallet")}
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
