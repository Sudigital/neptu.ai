import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Wallet,
  Bot,
  ChevronDown,
  Coins,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  AtSign,
  Trophy,
  Menu,
  FileText,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/assets/logo";
import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { useAgentStats } from "@/hooks/use-agent-stats";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const { stats: agentStats, loading: agentLoading } = useAgentStats();
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
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

  const voteCount = agentStats?.project.totalVotes ?? 0;
  const voteText = voteCount === 1 ? "vote" : "votes";

  const agentLink = (
    <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">{t("nav.agent")}</span>
          {agentStats && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
              {voteCount} {voteText}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {agentStats?.agent.displayName || "Neptu Agent"}
          </DialogTitle>
          <DialogDescription>
            AI agent participating in Colosseum Hackathon Arena
          </DialogDescription>
        </DialogHeader>

        {agentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : agentStats ? (
          <div className="space-y-4">
            {/* Agent Rank */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Arena Rank</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                #{agentStats.agent.rank}
              </span>
            </div>

            {/* Project Votes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {agentStats.project.totalVotes}
                </p>
                <p className="text-xs text-muted-foreground">Total Votes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">
                  {agentStats.project.humanVotes}
                </p>
                <p className="text-xs text-muted-foreground">Human</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-600">
                  {agentStats.project.agentVotes}
                </p>
                <p className="text-xs text-muted-foreground">Agent</p>
              </div>
            </div>

            {/* Agent Activity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.posts}
                  </p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.comments}
                  </p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.votesGiven}
                  </p>
                  <p className="text-xs text-muted-foreground">Votes Given</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.mentions}
                  </p>
                  <p className="text-xs text-muted-foreground">Mentions</p>
                </div>
              </div>
            </div>

            {/* X/Twitter Link */}
            {agentStats.agent.xUsername && (
              <a
                href={`https://x.com/${agentStats.agent.xUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{agentStats.agent.xUsername}
              </a>
            )}

            {/* View Project Button */}
            <a
              href={agentStats.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              View Project on Colosseum
              <ExternalLink className="h-4 w-4" />
            </a>

            <p className="text-xs text-center text-muted-foreground">
              Last updated: {new Date(agentStats.updatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to load agent stats</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

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
                    <span className="font-medium">Crypto Birthdays</span>
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
                      Top Cryptos
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
                        View all {cryptos.length} cryptos
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </nav>

              {/* Theme & Language in Sidebar Footer */}
              <div className="border-t p-4 mt-auto">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeSwitch />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">
                    Language
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
            <a
              href="https://docs.neptu.sudigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t("nav.docs")}
            </a>
            {cryptos && cryptos.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                    <Coins className="h-4 w-4" />
                    Cryptos
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
                      All Crypto Birthdays
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
                          View all {cryptos.length} cryptos
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
                Cryptos
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          {agentLink}
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
