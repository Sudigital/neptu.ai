import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { OracleSheet } from "@/features/oracle";
import { Button } from "@/components/ui/button";
import { Vote, ExternalLink } from "lucide-react";

interface TopNavLink {
  title: string;
  href: string;
  isActive: boolean;
  disabled?: boolean;
  external?: boolean;
}

interface DashboardHeaderProps {
  topNav: TopNavLink[];
  showVoteButton?: boolean;
  t: (key: string) => string;
}

export function DashboardHeader({
  topNav,
  showVoteButton = false,
  t,
}: DashboardHeaderProps) {
  return (
    <Header>
      <TopNav links={topNav} />
      <div className="ms-auto flex items-center gap-2 sm:gap-4">
        {showVoteButton && (
          <Button
            asChild
            size="sm"
            className="hidden sm:flex bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg animate-pulse hover:animate-none"
          >
            <a
              href="https://colosseum.com/agent-hackathon/projects/neptu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Vote className="h-4 w-4" />
              <span className="hidden md:inline">
                {t("common.voteForNeptu")}
              </span>
              <span className="md:hidden">Vote</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
        <OracleSheet />
        <ThemeSwitch />
        <div className="hidden sm:block">
          <ConfigDrawer />
        </div>
        <ProfileDropdown />
      </div>
    </Header>
  );
}
