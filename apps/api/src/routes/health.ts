import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/", (c) => {
  return c.json({
    name: "Neptu API",
    version: "0.1.0",
    tagline: "Your Balinese Soul, On-Chain",
  });
});

healthRoutes.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
