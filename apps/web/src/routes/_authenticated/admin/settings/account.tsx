import { SettingsAccount } from "@/features/admin/settings/account";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/admin/settings/account")({
  validateSearch: searchSchema,
  component: SettingsAccount,
});
