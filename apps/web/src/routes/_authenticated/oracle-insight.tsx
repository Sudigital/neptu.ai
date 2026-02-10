import { createFileRoute } from "@tanstack/react-router";
import { OracleInsightPage } from "@/features/oracle/oracle-insight-page";

export const Route = createFileRoute("/_authenticated/oracle-insight")({
  component: OracleInsightPage,
});
