import { Users } from "@/features/admin/users";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/admin/users")({
  validateSearch: searchSchema,
  component: Users,
});
