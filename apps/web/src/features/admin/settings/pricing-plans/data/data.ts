import { type PlanStatus } from "./schema";

export const statusStyles = new Map<PlanStatus, string>([
  ["active", "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"],
  [
    "cancelled",
    "bg-zinc-100/30 text-zinc-700 dark:text-zinc-300 border-zinc-300",
  ],
  [
    "expired",
    "bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-300",
  ],
  ["past_due", "bg-red-100/30 text-red-900 dark:text-red-200 border-red-300"],
]);
