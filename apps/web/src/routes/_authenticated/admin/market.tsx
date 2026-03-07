import { AdminMarket } from "@/features/admin/admin-market";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/market")({
  component: AdminMarket,
});
