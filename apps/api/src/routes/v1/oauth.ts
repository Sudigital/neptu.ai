import { zValidator } from "@hono/zod-validator";
import {
  OAuthClientService,
  OAuthTokenService,
  OAuthWebhookService,
  UserService,
  type Database,
  authorizeRequestSchema,
  authorizeDecisionSchema,
  tokenRequestSchema,
  revokeTokenSchema,
} from "@neptu/drizzle-orm";
import {
  OAUTH_CODE_CHALLENGE_METHODS,
  OAUTH_GRANT_TYPES,
  OAUTH_JWT_ISSUER,
  OAUTH_RESPONSE_TYPES,
  OAUTH_SCOPES,
  type OAuthScope,
} from "@neptu/shared";
import { Hono } from "hono";

import { dynamicJwtAuth } from "../../middleware/dynamic-jwt-auth";
import { rateLimit } from "../../middleware/rate-limit";

type Env = {
  Variables: {
    db: Database;
    dynamicUserId?: string;
    walletAddress?: string;
    userId?: string;
  };
};

export const oauthRoutes = new Hono<Env>();

// Rate limiters per endpoint sensitivity
const tokenRateLimit = rateLimit({ limit: 20, windowSeconds: 60 });
const authorizeRateLimit = rateLimit({ limit: 30, windowSeconds: 60 });
const revokeRateLimit = rateLimit({ limit: 30, windowSeconds: 60 });
const userinfoRateLimit = rateLimit({ limit: 60, windowSeconds: 60 });

// ============================================================================
// GET /authorize — Return consent screen data
// ============================================================================

oauthRoutes.get(
  "/authorize",
  authorizeRateLimit,
  dynamicJwtAuth as never,
  zValidator("query", authorizeRequestSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const query = c.req.valid("query");

    const clientService = new OAuthClientService(db);
    const client = await clientService.getClientByClientId(query.client_id);

    if (!client || !client.isActive) {
      return c.json(
        {
          error: "invalid_client",
          error_description: "Client not found or inactive",
        },
        400
      );
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(query.redirect_uri)) {
      return c.json(
        { error: "invalid_request", error_description: "Invalid redirect URI" },
        400
      );
    }

    // Validate scopes
    const requestedScopes = query.scope.split(" ") as OAuthScope[];
    const invalidScopes = requestedScopes.filter(
      (s) => !client.scopes.includes(s)
    );
    if (invalidScopes.length > 0) {
      return c.json(
        {
          error: "invalid_scope",
          error_description: `Invalid scopes: ${invalidScopes.join(", ")}`,
        },
        400
      );
    }

    return c.json({
      success: true,
      consent: {
        client: {
          name: client.name,
          description: client.description,
          logoUrl: client.logoUrl,
        },
        requestedScopes,
        redirectUri: query.redirect_uri,
        state: query.state,
      },
    });
  }
);

// ============================================================================
// POST /authorize — User approves/denies
// ============================================================================

oauthRoutes.post(
  "/authorize",
  authorizeRateLimit,
  dynamicJwtAuth as never,
  zValidator("json", authorizeDecisionSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const walletAddress = c.get("walletAddress") as string;
    const input = c.req.valid("json");

    if (!input.approved) {
      const redirectUrl = new URL(input.redirect_uri);
      redirectUrl.searchParams.set("error", "access_denied");
      redirectUrl.searchParams.set(
        "error_description",
        "User denied the authorization request"
      );
      redirectUrl.searchParams.set("state", input.state);

      // Fire webhook for denial (async, non-blocking)
      const clientService = new OAuthClientService(db);
      clientService
        .getClientByClientId(input.client_id)
        .then((client) => {
          if (client) {
            const webhookService = new OAuthWebhookService(db);
            webhookService
              .dispatchEvent(client.id, "authorization.denied", {
                client_id: input.client_id,
              })
              .catch(() => {});
          }
        })
        .catch(() => {});

      return c.json({
        success: true,
        redirect: redirectUrl.toString(),
      });
    }

    // Resolve user from wallet address
    const userService = new UserService(db);
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      return c.json(
        { error: "invalid_request", error_description: "User not found" },
        400
      );
    }

    const tokenService = new OAuthTokenService(db);
    const scopes = input.scope.split(" ") as OAuthScope[];

    try {
      const result = await tokenService.createAuthorizationCode({
        clientId: input.client_id,
        userId: user.id,
        redirectUri: input.redirect_uri,
        scopes,
        codeChallenge: input.code_challenge,
        codeChallengeMethod: input.code_challenge_method,
        state: input.state,
      });

      const redirectUrl = new URL(result.redirectUri);
      redirectUrl.searchParams.set("code", result.code);
      redirectUrl.searchParams.set("state", result.state);

      // Fire webhook for authorization granted
      const clientService = new OAuthClientService(db);
      clientService
        .getClientByClientId(input.client_id)
        .then((client) => {
          if (client) {
            const webhookService = new OAuthWebhookService(db);
            webhookService
              .dispatchEvent(client.id, "authorization.granted", {
                client_id: input.client_id,
                user_id: user.id,
                scopes: scopes,
              })
              .catch(() => {});
          }
        })
        .catch(() => {});

      return c.json({
        success: true,
        redirect: redirectUrl.toString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authorization failed";
      return c.json({ error: "server_error", error_description: message }, 500);
    }
  }
);

// ============================================================================
// POST /token — Exchange code, refresh, or client_credentials
// ============================================================================

oauthRoutes.post(
  "/token",
  tokenRateLimit,
  zValidator("form", tokenRequestSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const input = c.req.valid("form");
    const tokenService = new OAuthTokenService(db);

    try {
      let response;

      switch (input.grant_type) {
        case "authorization_code":
          response = await tokenService.exchangeAuthorizationCode({
            code: input.code,
            redirectUri: input.redirect_uri,
            clientId: input.client_id,
            clientSecret: input.client_secret,
            codeVerifier: input.code_verifier,
          });
          break;

        case "client_credentials":
          response = await tokenService.clientCredentialsGrant({
            clientId: input.client_id,
            clientSecret: input.client_secret,
            scope: input.scope,
          });
          break;

        case "refresh_token":
          response = await tokenService.refreshTokenGrant({
            refreshToken: input.refresh_token,
            clientId: input.client_id,
            clientSecret: input.client_secret,
            scope: input.scope,
          });
          break;
      }

      // OAuth2 spec: token endpoint returns application/json with cache headers
      c.header("Cache-Control", "no-store");
      c.header("Pragma", "no-cache");

      // Fire webhook for token creation (async, non-blocking)
      const clientService = new OAuthClientService(db);
      clientService
        .getClientByClientId(input.client_id)
        .then((client) => {
          if (client) {
            const webhookService = new OAuthWebhookService(db);
            webhookService
              .dispatchEvent(client.id, "token.created", {
                client_id: input.client_id,
                grant_type: input.grant_type,
                scope: response?.scope,
              })
              .catch(() => {});
          }
        })
        .catch(() => {});

      return c.json(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Token exchange failed";
      return c.json(
        { error: "invalid_grant", error_description: message },
        400
      );
    }
  }
);

// ============================================================================
// POST /revoke — Revoke a token (RFC 7009)
// ============================================================================

oauthRoutes.post(
  "/revoke",
  revokeRateLimit,
  zValidator("form", revokeTokenSchema),
  async (c) => {
    const db = c.get("db") as Database;
    const input = c.req.valid("form");
    const tokenService = new OAuthTokenService(db);

    try {
      await tokenService.revokeToken({
        token: input.token,
        tokenTypeHint: input.token_type_hint,
        clientId: input.client_id,
        clientSecret: input.client_secret,
      });

      // Fire webhook for token revocation (async, non-blocking)
      if (input.client_id) {
        const clientService = new OAuthClientService(db);
        clientService
          .getClientByClientId(input.client_id)
          .then((client) => {
            if (client) {
              const webhookService = new OAuthWebhookService(db);
              webhookService
                .dispatchEvent(client.id, "token.revoked", {
                  client_id: input.client_id,
                  token_type_hint: input.token_type_hint,
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
      }
    } catch {
      // RFC 7009: always respond 200 even on errors
    }

    return c.json({ success: true });
  }
);

// ============================================================================
// GET /userinfo — Get authorized user info
// ============================================================================

oauthRoutes.get("/userinfo", userinfoRateLimit, async (c) => {
  const db = c.get("db") as Database;
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { error: "invalid_token", error_description: "Bearer token required" },
      401
    );
  }

  const token = authHeader.slice(7);
  const tokenService = new OAuthTokenService(db);

  let payload;
  try {
    payload = tokenService.verifyAccessToken(token);
  } catch {
    return c.json(
      { error: "invalid_token", error_description: "Invalid token" },
      401
    );
  }

  const revoked = await tokenService.isTokenRevoked(payload.jti);
  if (revoked) {
    return c.json(
      { error: "invalid_token", error_description: "Token revoked" },
      401
    );
  }

  if (!payload.sub) {
    return c.json(
      {
        error: "invalid_token",
        error_description: "No user associated with this token",
      },
      400
    );
  }

  const userService = new UserService(db);
  const user = await userService.getUserById(payload.sub);
  if (!user) {
    return c.json(
      { error: "invalid_token", error_description: "User not found" },
      404
    );
  }

  const scopes = payload.scope.split(" ");

  // Build response based on scopes
  const userInfo: Record<string, unknown> = {
    sub: user.id,
    wallet_address: user.walletAddress,
  };

  if (scopes.includes("neptu:read")) {
    userInfo.display_name = user.displayName;
  }

  return c.json(userInfo);
});

// ============================================================================
// GET /.well-known/oauth-authorization-server — Discovery (RFC 8414)
// ============================================================================

export const oauthDiscoveryRoutes = new Hono<Env>();

oauthDiscoveryRoutes.get("/oauth-authorization-server", (c) => {
  const baseUrl = OAUTH_JWT_ISSUER;

  return c.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/v1/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/v1/oauth/token`,
    revocation_endpoint: `${baseUrl}/api/v1/oauth/revoke`,
    userinfo_endpoint: `${baseUrl}/api/v1/oauth/userinfo`,
    scopes_supported: OAUTH_SCOPES,
    response_types_supported: OAUTH_RESPONSE_TYPES,
    grant_types_supported: OAUTH_GRANT_TYPES,
    token_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
    ],
    code_challenge_methods_supported: OAUTH_CODE_CHALLENGE_METHODS,
    service_documentation: `${baseUrl}/docs`,
  });
});
