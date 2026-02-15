import { SettingsPricingPlans } from "@/features/admin/settings/pricing-plans";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
});

export const Route = createFileRoute(
  "/_authenticated/admin/settings/pricing-plans"
)({
  validateSearch: searchSchema,
  component: SettingsPricingPlans,
});
