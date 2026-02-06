import {
  LayoutDashboard,
  Monitor,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  Heart,
  Wallet,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { type SidebarData } from "../types";
import { Logo } from "@/assets/logo";

export const sidebarData: SidebarData = {
  user: {
    name: "Guest",
    email: "Connect wallet",
    avatar: "/avatars/default.jpg",
  },
  teams: [
    {
      name: "Neptu",
      logo: Logo,
      plan: "Your Balinese Soul, On-Chain",
    },
  ],
  navGroups: [
    {
      title: "Discover",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Compatibility",
          url: "/coming-soon",
          icon: Heart,
          badge: "Soon",
        },
      ],
    },
    {
      title: "Your Soul",
      items: [
        {
          title: "Wallet",
          url: "/wallet",
          icon: Wallet,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Settings",
          icon: Settings,
          items: [
            {
              title: "Profile",
              url: "/settings",
              icon: UserCog,
            },
            {
              title: "Account",
              url: "/settings/account",
              icon: Wrench,
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
              icon: Palette,
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
              icon: Bell,
            },
            {
              title: "Display",
              url: "/settings/display",
              icon: Monitor,
            },
          ],
        },
        {
          title: "Learn",
          url: "/coming-soon",
          icon: BookOpen,
          badge: "Soon",
        },
        {
          title: "Help",
          url: "/coming-soon",
          icon: HelpCircle,
          badge: "Soon",
        },
      ],
    },
  ],
};
