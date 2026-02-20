import { createDatabase } from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import { CORS_ALLOWED_ORIGINS } from "@neptu/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { trimTrailingSlash } from "hono/trailing-slash";

import { mountOpenAPI } from "./lib/openapi";
import { requestLogger } from "./middleware/request-logger";
import { healthRoutes } from "./routes/health";
import {
  adminRoutes,
  apiPricingRoutes,
  apiSubscriptionPaymentRoutes,
  apiUsageRoutes,
  authRoutes,
  developerRoutes,
  developerOAuthRoutes,
  developerWebhookRoutes,
  oauthRoutes,
  oauthDiscoveryRoutes,
  paymentRoutes,
  pricingRoutes,
  readingRoutes,
  tokenRoutes,
  userRoutes,
  voiceRoutes,
  walletRoutes,
} from "./routes/v1";

type Variables = {
  db: ReturnType<typeof createDatabase>;
  adminWalletAddress: string | undefined;
};

const API_URL = process.env.API_URL ?? "http://localhost:3000";

const app = new Hono<{ Variables: Variables }>();

// Normalize URLs — strip trailing slashes so /reference/ → /reference
app.use(trimTrailingSlash());

// CORS must be first to handle preflight OPTIONS requests
app.use(
  "*",
  cors({
    origin: [
      ...CORS_ALLOWED_ORIGINS,
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8787",
      "https://neptu.pages.dev",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Wallet-Address"],
    credentials: true,
  })
);

// Middleware
app.use("*", requestLogger);
app.use("*", prettyJSON());

// Inject database into context
const db = createDatabase();
app.use("*", async (c, next) => {
  c.set("db", db);
  c.set("adminWalletAddress", process.env.ADMIN_WALLET_ADDRESS);
  await next();
});

// Routes
app.route("/", healthRoutes);
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/reading", readingRoutes);
app.route("/api/v1/users", userRoutes);
app.route("/api/v1/token", tokenRoutes);
app.route("/api/v1/pay", paymentRoutes);
app.route("/api/v1/wallet", walletRoutes);
app.route("/api/v1/pricing", pricingRoutes);
app.route("/api/v1/developer", developerRoutes);
app.route("/api/v1/developer/api-pricing", apiPricingRoutes);
app.route("/api/v1/developer", apiUsageRoutes);
app.route("/api/v1/developer/pay", apiSubscriptionPaymentRoutes);
app.route("/api/v1/admin", adminRoutes);
app.route("/api/v1/developer/oauth", developerOAuthRoutes);
app.route("/api/v1/developer/oauth", developerWebhookRoutes);
app.route("/api/v1/oauth", oauthRoutes);
app.route("/api/v1/voice", voiceRoutes);
app.route("/api/v1/.well-known", oauthDiscoveryRoutes);

// OpenAPI spec + Scalar API Reference
mountOpenAPI(app, API_URL);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found", message: "Route not found" }, 404);
});

// Error handler
const log = createLogger({ name: "api" });
app.onError((err, c) => {
  log.error(
    {
      method: c.req.method,
      path: c.req.path,
      err: { message: err.message, stack: err.stack },
    },
    "unhandled error"
  );
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

const port = Number(process.env.PORT || 3000);
log.info({ port }, "Neptu API started");
log.info(`API Reference: ${API_URL}/reference`);
Bun.serve({ fetch: app.fetch, port });
