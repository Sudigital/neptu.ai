import { PricingPage } from "@/features/pricing/pricing-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});
