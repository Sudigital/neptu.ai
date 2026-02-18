import { DeveloperDashboard } from "@/features/developer";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/developer/")({
  component: DeveloperDashboard,
});
