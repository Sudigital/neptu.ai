import { OAuthConsentPage } from "@/features/oauth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/oauth/authorize")({
  component: OAuthConsentPage,
});
