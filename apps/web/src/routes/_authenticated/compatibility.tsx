import { CompatibilityPage } from "@/features/compatibility";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/compatibility")({
  component: CompatibilityPage,
});
