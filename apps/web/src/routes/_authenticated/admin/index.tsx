import { AdminDashboard } from "@/features/admin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});
