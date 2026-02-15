import { Logo } from "@/assets/logo";
import {
  LayoutDashboard,
  Settings,
  Heart,
  Wallet,
  HelpCircle,
  BookOpen,
} from "lucide-react";

import { type SidebarData } from "../types";

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
          url: "/settings",
          icon: Settings,
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
