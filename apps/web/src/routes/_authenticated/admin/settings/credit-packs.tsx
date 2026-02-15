import { SettingsCreditPacks } from "@/features/admin/settings/credit-packs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/admin/settings/credit-packs"
)({
  component: SettingsCreditPacks,
});
