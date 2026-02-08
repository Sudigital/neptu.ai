import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/assets/logo";
import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { AgentDialog } from "@/components/agent-dialog";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
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

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

interface CryptoItem {
  symbol: string;
  name: string;
  image?: string;
}

export function Navbar() {
  const { login, authenticated } = usePrivy();
  const { hasWallet } = useUser();
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
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden p-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] sm:w-[320px] flex flex-col p-0"
              aria-describedby={undefined}
            >
              <SheetHeader className="p-4 pb-0">
                <SheetTitle className="flex items-center gap-2">
                  <Logo className="h-6 w-6 text-primary" />
                  <span>Neptu</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col flex-1 gap-1 mt-4 px-4 overflow-y-auto">
                <SheetClose asChild>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t("nav.pricing")}</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/p2p"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t("nav.p2pTrading")}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-500 text-amber-500 ml-auto"
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t("nav.docs")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </a>
                </SheetClose>

                {/* Crypto List in Mobile Menu */}
                {cryptos && cryptos.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {t("nav.topCryptos")}
                    </p>
                    {cryptos.slice(0, 8).map((crypto) => (
                      <SheetClose key={crypto.symbol} asChild>
                        <Link
                          to="/cryptos/$symbol"
                          params={{ symbol: crypto.symbol.toLowerCase() }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          {crypto.image ? (
                            <img
                              src={crypto.image}
                              alt={crypto.name}
                              className="h-5 w-5 rounded-full"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
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
                        className="flex items-center justify-center gap-2 px-3 py-2 mt-2 text-sm text-primary hover:underline"
                      >
                        {t("nav.viewAllCryptos").replace(
                          "{{count}}",
                          String(cryptos.length),
                        )}
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </nav>

              {/* Theme & Language in Sidebar Footer */}
              <div className="border-t p-4 mt-auto">
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
            <Logo className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              Neptu
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              to="/p2p"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {t("nav.p2p")}
              <Badge
                variant="outline"
                className="text-[9px] border-amber-500 text-amber-500 px-1 py-0"
              >
                {t("nav.soon")}
              </Badge>
            </Link>
            {cryptos && cryptos.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                    <Coins className="h-4 w-4" />
                    {t("nav.cryptos")}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 max-h-80 overflow-y-auto"
                >
                  <DropdownMenuLabel>
                    <Link
                      to="/cryptos"
                      className="flex items-center gap-2 w-full"
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
                        className="flex items-center gap-2 w-full cursor-pointer"
                      >
                        {crypto.image ? (
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="h-5 w-5 rounded-full"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
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
                          className="flex items-center justify-center gap-2 w-full text-primary"
                        >
                          {t("nav.viewAllCryptos").replace(
                            "{{count}}",
                            String(cryptos.length),
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
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
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
            className="hidden md:flex text-sm font-medium text-muted-foreground hover:text-primary transition-colors items-center gap-1.5"
          >
            <Tag className="h-4 w-4" />
            {t("nav.pricing")}
          </Link>
          <a
            href="https://docs.neptu.sudigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex text-sm font-medium text-muted-foreground hover:text-primary transition-colors items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            {t("nav.docs")}
          </a>
          <AgentDialog />
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <div className="hidden md:block">
            <ThemeSwitch />
          </div>
          {authenticated && hasWallet ? (
            <ProfileDropdown />
          ) : (
            <Button
              onClick={login}
              size="sm"
              className="bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white text-xs sm:text-sm px-2.5 sm:px-4"
            >
              <Wallet className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {t("landing.connectWallet")}
              </span>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
