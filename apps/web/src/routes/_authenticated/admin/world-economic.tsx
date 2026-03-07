import { AdminWorldEconomic } from "@/features/admin/admin-world-economic";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/world-economic")({
  component: AdminWorldEconomic,
});
