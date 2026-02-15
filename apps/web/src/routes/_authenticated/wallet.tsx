import { Wallet } from "@/features/wallet";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: Wallet,
});
