import { useMemo } from "react";
import {
  LayoutDashboard,
  Monitor,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  Users,
  Wallet,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { Logo } from "@/assets/logo";
import { useTranslate } from "@/hooks/use-translate";
import { type SidebarData } from "../types";

export function useSidebarData(): SidebarData {
  const t = useTranslate();

  return useMemo(
    () => ({
      user: {
        name: "Guest",
        email: t("user.connectWallet"),
        avatar: "/avatars/default.jpg",
      },
      teams: [
        {
          name: "Neptu",
          logo: Logo,
          plan: t("sidebar.plan", "Your Balinese Soul, On-Chain"),
        },
      ],
      navGroups: [
        {
          title: t("sidebar.discover"),
          items: [
            {
              title: t("nav.dashboard"),
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: t("nav.compatibility"),
              url: "/compatibility",
              icon: Users,
            },
          ],
        },
        {
          title: t("sidebar.yourSoul"),
          items: [
            {
              title: t("nav.wallet"),
              url: "/wallet",
              icon: Wallet,
            },
          ],
        },
        {
          title: t("sidebar.settings"),
          items: [
            {
              title: t("nav.settings"),
              icon: Settings,
              items: [
                {
                  title: t("settings.profile"),
                  url: "/settings",
                  icon: UserCog,
                },
                {
                  title: t("settings.account"),
                  url: "/settings/account",
                  icon: Wrench,
                },
                {
                  title: t("settings.appearance"),
                  url: "/settings/appearance",
                  icon: Palette,
                },
                {
                  title: t("settings.notifications"),
                  url: "/settings/notifications",
                  icon: Bell,
                },
                {
                  title: t("settings.display"),
                  url: "/settings/display",
                  icon: Monitor,
                },
              ],
            },
            {
              title: t("nav.learn"),
              url: "/coming-soon",
              icon: BookOpen,
              badge: t("badge.soon", "Soon"),
            },
            {
              title: t("nav.help"),
              url: "/coming-soon",
              icon: HelpCircle,
              badge: t("badge.soon", "Soon"),
            },
          ],
        },
      ],
    }),
    [t],
  );
}
