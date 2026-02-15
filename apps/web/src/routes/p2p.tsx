import { P2PPage } from "@/features/p2p";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/p2p")({
  component: P2PPage,
});
