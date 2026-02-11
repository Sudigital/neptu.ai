import { createFileRoute } from "@tanstack/react-router";
import { P2PPage } from "@/features/p2p";

export const Route = createFileRoute("/p2p")({
  component: P2PPage,
});
