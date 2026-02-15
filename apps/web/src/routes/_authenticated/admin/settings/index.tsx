import { SettingsGeneral } from "@/features/admin/settings/general";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/settings/")({
  component: SettingsGeneral,
});
