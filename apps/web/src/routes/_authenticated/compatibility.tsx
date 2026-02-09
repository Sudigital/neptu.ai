import { createFileRoute } from "@tanstack/react-router";
import { CompatibilityPage } from "@/features/compatibility";

export const Route = createFileRoute("/_authenticated/compatibility")({
  component: CompatibilityPage,
});
