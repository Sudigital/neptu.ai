import type { Hono } from "hono";
import type { BlankSchema, Env } from "hono/types";

import { Scalar } from "@scalar/hono-api-reference";

const TAG_MAP: [string, string][] = [
  ["/api/v1/developer/oauth", "Developer OAuth"],
  ["/api/v1/developer/api-pricing", "Developer API Pricing"],
  ["/api/v1/developer/pay", "Developer Payment"],
  ["/api/v1/developer", "Developer"],
  ["/api/v1/auth", "Auth"],
  ["/api/v1/reading", "Reading"],
  ["/api/v1/users", "User"],
  ["/api/v1/token", "Token"],
  ["/api/v1/wallet", "Wallet"],
  ["/api/v1/pay", "Payment"],
  ["/api/v1/pricing", "Pricing"],
  ["/api/v1/voice", "Voice"],
  ["/api/v1/oauth", "OAuth"],
  ["/api/v1/admin", "Admin"],
  ["/api/v1/.well-known", "OAuth"],
];

const TAG_DEFINITIONS = [
  { name: "Health", description: "Server health and status" },
  { name: "Auth", description: "Wallet-based authentication" },
  { name: "Reading", description: "Balinese calendar readings" },
  { name: "User", description: "User profile and onboarding" },
  { name: "Token", description: "NEPTU token operations" },
  { name: "Wallet", description: "Wallet balances, rewards, streaks" },
  { name: "Payment", description: "SOL/NEPTU/SUDIGITAL payment flows" },
  { name: "Pricing", description: "Reading pricing plans" },
  { name: "Voice", description: "Voice oracle (STT, TTS, AI)" },
  { name: "Developer", description: "API keys and subscriptions" },
  { name: "Developer API Pricing", description: "API pricing plans" },
  { name: "Developer OAuth", description: "OAuth client management" },
  { name: "Developer Payment", description: "Subscription payments" },
  { name: "OAuth", description: "OAuth 2.0 authorization flows" },
  { name: "Admin", description: "Administrative endpoints" },
];

const SKIP_ROUTES = new Set(["/doc", "/reference", "*"]);

function deriveTag(path: string): string {
  for (const [prefix, tag] of TAG_MAP) {
    if (path.startsWith(prefix)) return tag;
  }
  return "Health";
}

const PUBLIC_ROUTES = new Set([
  "/",
  "/health",
  "/api/v1/auth/nonce",
  "/api/v1/auth/verify",
  "/api/v1/auth/session",
  "/api/v1/pricing",
  "/api/v1/.well-known/oauth-authorization-server",
]);

function buildPaths(
  routes: Hono["routes"]
): Record<string, Record<string, unknown>> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of routes) {
    if (SKIP_ROUTES.has(route.path) || route.method === "ALL") continue;

    const openApiPath = route.path.replace(/:(\w+)/g, "{$1}");
    const method = route.method.toLowerCase();

    const params = [...route.path.matchAll(/:(\w+)/g)].map((m) => ({
      name: m[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    }));

    if (!paths[openApiPath]) paths[openApiPath] = {};
    if (paths[openApiPath][method]) continue;

    const isPublic = PUBLIC_ROUTES.has(route.path);

    paths[openApiPath][method] = {
      summary: `${route.method} ${route.path}`,
      tags: [deriveTag(route.path)],
      ...(params.length > 0 && { parameters: params }),
      ...(!isPublic && { security: [{ bearerAuth: [] }] }),
      responses: {
        "200": {
          description: "Success",
          content: { "application/json": { schema: { type: "object" } } },
        },
        ...(!isPublic && {
          "401": { description: "Unauthorized — valid JWT required" },
        }),
      },
    };
  }

  return paths;
}

export function mountOpenAPI<E extends Env>(
  app: Hono<E, BlankSchema, "/">,
  apiUrl: string
): void {
  if (process.env.NODE_ENV === "production") return;

  app.get("/doc", (c) => {
    return c.json({
      openapi: "3.1.0",
      info: {
        title: "Neptu API",
        description: "Your Balinese Soul, On-Chain",
        version: "0.1.0",
      },
      servers: [{ url: apiUrl }],
      tags: TAG_DEFINITIONS,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "PASETO",
            description: "PASETO v4.local token from wallet authentication",
          },
        },
      },
      paths: buildPaths(app.routes),
    });
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      theme: "purple",
    })
  );
}
