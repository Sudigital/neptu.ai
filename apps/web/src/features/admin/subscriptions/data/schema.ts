export type { ApiSubscriptionDTO as Subscription } from "@neptu/drizzle-orm";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due";
