import { DeveloperOAuthPortal } from "@/features/oauth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/developer/oauth")({
  component: DeveloperOAuthPortal,
});
