import { createDatabase } from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import { CORS_ALLOWED_ORIGINS } from "@neptu/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";

import { requestLogger } from "./middleware/request-logger";
import { adminRoutes } from "./routes/admin";
import { apiPricingRoutes } from "./routes/api-pricing";
import { apiSubscriptionPaymentRoutes } from "./routes/api-subscription-payment";
import { apiUsageRoutes } from "./routes/api-usage";
import { authRoutes } from "./routes/auth";
import { developerRoutes } from "./routes/developer";
import { healthRoutes } from "./routes/health";
import { paymentRoutes } from "./routes/payment";
import { pricingRoutes } from "./routes/pricing";
import { readingRoutes } from "./routes/reading";
import { tokenRoutes } from "./routes/token";
import { userRoutes } from "./routes/user";
import { walletRoutes } from "./routes/wallet";

type Variables = {
  db: ReturnType<typeof createDatabase>;
  adminWalletAddress: string | undefined;
};

const app = new Hono<{ Variables: Variables }>();

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
app.route("/api/auth", authRoutes);
app.route("/api/reading", readingRoutes);
app.route("/api/users", userRoutes);
app.route("/api/token", tokenRoutes);
app.route("/api/pay", paymentRoutes);
app.route("/api/wallet", walletRoutes);
app.route("/api/pricing", pricingRoutes);
app.route("/api/developer", developerRoutes);
app.route("/api/developer/api-pricing", apiPricingRoutes);
app.route("/api/developer", apiUsageRoutes);
app.route("/api/developer/pay", apiSubscriptionPaymentRoutes);
app.route("/api/admin", adminRoutes);

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
Bun.serve({ fetch: app.fetch, port });
