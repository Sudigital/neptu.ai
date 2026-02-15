import type { ApiScope } from "@neptu/shared";
import type { Context, Next } from "hono";

import {
  ApiKeyService,
  ApiSubscriptionService,
  ApiUsageService,
  type Database,
} from "@neptu/drizzle-orm";

interface ApiAuthEnv {
  Variables: {
    db: Database;
    apiKeyId: string;
    apiKeyUserId: string;
    apiKeyScopes: string[];
    subscriptionId: string | null;
  };
}

interface ApiKeyValidationResult {
  valid: boolean;
  keyId?: string;
  userId?: string;
  scopes?: string[];
  subscriptionId?: string;
  error?: string;
}

async function validateApiKey(
  db: Database,
  authHeader: string | undefined
): Promise<ApiKeyValidationResult> {
  if (!authHeader) {
    return { valid: false, error: "Authorization header required" };
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return {
      valid: false,
      error: "Invalid authorization format. Use: Bearer <api_key>",
    };
  }

  if (!token.startsWith("nptu_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  const apiKeyService = new ApiKeyService(db);
  const key = await apiKeyService.validateKey(token);

  if (!key) {
    return { valid: false, error: "Invalid or expired API key" };
  }

  const apiSubscriptionService = new ApiSubscriptionService(db);
  const subscription = await apiSubscriptionService.getActiveSubscription(
    key.userId
  );

  return {
    valid: true,
    keyId: key.id,
    userId: key.userId,
    scopes: key.scopes,
    subscriptionId: subscription?.id,
  };
}

export function apiKeyAuth() {
  return async (c: Context<ApiAuthEnv>, next: Next) => {
    const db = c.get("db") as Database;
    const authHeader = c.req.header("Authorization");

    const result = await validateApiKey(db, authHeader);

    if (!result.valid) {
      return c.json({ success: false, error: result.error }, 401);
    }

    c.set("apiKeyId", result.keyId!);
    c.set("apiKeyUserId", result.userId!);
    c.set("apiKeyScopes", result.scopes!);
    c.set("subscriptionId", result.subscriptionId ?? null);

    await next();
  };
}

export function requireScope(...requiredScopes: ApiScope[]) {
  return async (c: Context<ApiAuthEnv>, next: Next) => {
    const scopes = c.get("apiKeyScopes") as string[];

    if (!scopes) {
      return c.json(
        { success: false, error: "API key not authenticated" },
        401
      );
    }

    const hasScope = requiredScopes.some((scope) => scopes.includes(scope));

    if (!hasScope) {
      return c.json(
        {
          success: false,
          error: `Insufficient permissions. Required: ${requiredScopes.join(" or ")}`,
        },
        403
      );
    }

    await next();
  };
}

export function requireSubscription() {
  return async (c: Context<ApiAuthEnv>, next: Next) => {
    const subscriptionId = c.get("subscriptionId");

    if (!subscriptionId) {
      return c.json(
        { success: false, error: "Active API subscription required" },
        403
      );
    }

    await next();
  };
}

interface TrackUsageOptions {
  endpoint: string;
  isAiEndpoint?: boolean;
  creditsUsed?: number;
}

export function trackUsage(options: TrackUsageOptions) {
  return async (c: Context<ApiAuthEnv>, next: Next) => {
    const startTime = Date.now();
    const db = c.get("db") as Database;
    const apiKeyId = c.get("apiKeyId") as string;
    const subscriptionId = c.get("subscriptionId") as string | null;

    const creditsNeeded = options.creditsUsed ?? 1;
    const isAi = options.isAiEndpoint ?? false;

    if (subscriptionId) {
      const apiSubscriptionService = new ApiSubscriptionService(db);
      const result = await apiSubscriptionService.useCredits(
        c.get("apiKeyUserId") as string,
        isAi ? 0 : creditsNeeded,
        isAi ? creditsNeeded : 0
      );

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: "Insufficient credits",
            remaining: result.remaining,
          },
          402
        );
      }
    }

    await next();

    const responseTime = Date.now() - startTime;
    const apiUsageService = new ApiUsageService(db);

    await apiUsageService.recordUsage({
      apiKeyId,
      endpoint: options.endpoint,
      method: c.req.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
      creditsUsed: creditsNeeded,
      isAiEndpoint: isAi,
      responseStatus: c.res.status,
      responseTimeMs: responseTime,
      ipAddress: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });
  };
}

export function checkRateLimit(requestsPerMinute: number) {
  const requestCounts = new Map<string, { count: number; resetAt: number }>();

  return async (c: Context<ApiAuthEnv>, next: Next) => {
    const apiKeyId = c.get("apiKeyId") as string;
    const now = Date.now();

    let record = requestCounts.get(apiKeyId);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + 60000 };
      requestCounts.set(apiKeyId, record);
    }

    record.count++;

    if (record.count > requestsPerMinute) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Limit", String(requestsPerMinute));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));

      return c.json(
        {
          success: false,
          error: "Rate limit exceeded",
          retryAfter,
        },
        429
      );
    }

    c.header("X-RateLimit-Limit", String(requestsPerMinute));
    c.header("X-RateLimit-Remaining", String(requestsPerMinute - record.count));
    c.header("X-RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));

    await next();
  };
}
