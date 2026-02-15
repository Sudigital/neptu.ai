import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { Outlet } from "@tanstack/react-router";
import {
  Monitor,
  Bell,
  Palette,
  Wrench,
  UserCog,
  AlertTriangle,
} from "lucide-react";

import { SidebarNav } from "./components/sidebar-nav";

export function Settings() {
  const t = useTranslate();
  const { hasBirthDate, isLoading } = useUser();

  const sidebarNavItems = [
    {
      title: t("settings.profile"),
      href: "/settings",
      icon: <UserCog size={18} />,
    },
    {
      title: t("settings.account"),
      href: "/settings/account",
      icon: <Wrench size={18} />,
    },
    {
      title: t("settings.appearance"),
      href: "/settings/appearance",
      icon: <Palette size={18} />,
    },
    {
      title: t("settings.notifications"),
      href: "/settings/notifications",
      icon: <Bell size={18} />,
    },
    {
      title: t("settings.display"),
      href: "/settings/display",
      icon: <Monitor size={18} />,
    },
  ];

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        {!isLoading && !hasBirthDate && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("settings.birthdayRequired.title")}</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              {t("settings.birthdayRequired.desc")}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("nav.settings")}
          </h1>
          <p className="text-muted-foreground">{t("settings.pageDesc")}</p>
        </div>
        <Separator className="my-4 lg:my-6" />
        <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="top-0 lg:sticky lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex w-full overflow-y-hidden p-1">
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  );
}
