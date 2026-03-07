import { AdminPersons } from "@/features/admin/admin-persons";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/persons")({
  component: AdminPersons,
});
