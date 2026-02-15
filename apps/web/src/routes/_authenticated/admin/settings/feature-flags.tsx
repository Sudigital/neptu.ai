import { SettingsFeatureFlags } from "@/features/admin/settings/feature-flags";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/admin/settings/feature-flags"
)({
  component: SettingsFeatureFlags,
});
