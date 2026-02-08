import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/features/pricing/pricing-page";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});
