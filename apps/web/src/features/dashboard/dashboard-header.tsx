import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { OracleSheet } from "@/features/oracle";

interface TopNavLink {
  title: string;
  href: string;
  isActive: boolean;
  disabled?: boolean;
  external?: boolean;
}

interface DashboardHeaderProps {
  topNav: TopNavLink[];
}

export function DashboardHeader({ topNav }: DashboardHeaderProps) {
  return (
    <Header fixed>
      <TopNav links={topNav} />
      <div className="ms-auto flex items-center gap-3 sm:gap-4">
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
