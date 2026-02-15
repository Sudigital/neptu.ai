import { Shield, User } from "lucide-react";

import { type UserStatus } from "./schema";

export const statusStyles = new Map<UserStatus, string>([
  ["active", "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"],
  ["pending", "bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300"],
]);

export const roles = [
  {
    label: "Admin",
    value: "admin",
    icon: Shield,
  },
  {
    label: "User",
    value: "user",
    icon: User,
  },
] as const;
