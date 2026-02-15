import { Logo } from "@/assets/logo";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import {
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  HelpCircle,
  BookOpen,
  Shield,
  Key,
  Activity,
  BarChart3,
} from "lucide-react";
import { useMemo } from "react";

import { type SidebarData } from "../types";

export function useSidebarData(): SidebarData {
  const t = useTranslate();
  const { user } = useUser();

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
        ...(user?.isAdmin
          ? [
              {
                title: "Admin",
                items: [
                  {
                    title: "Dashboard",
                    url: "/admin",
                    icon: Shield,
                  },
                  {
                    title: "Users",
                    url: "/admin/users",
                    icon: Users,
                  },
                  {
                    title: "Subscriptions",
                    url: "/admin/subscriptions",
                    icon: Key,
                  },
                  {
                    title: "Analytics",
                    url: "/admin/analytics",
                    icon: BarChart3,
                  },
                  {
                    title: "Settings",
                    url: "/admin/settings",
                    icon: Activity,
                  },
                ],
              },
            ]
          : []),
        {
          title: t("sidebar.settings"),
          items: [
            {
              title: t("nav.settings"),
              url: "/settings",
              icon: Settings,
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
    [t, user?.isAdmin]
  );
}
