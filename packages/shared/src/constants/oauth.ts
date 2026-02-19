// ============================================================================
// OAuth2 Provider Constants
// ============================================================================

// ---------------------------------------------------------------------------
// Scopes — subset of API_SCOPES relevant to OAuth consumers
// ---------------------------------------------------------------------------

export const OAUTH_SCOPES = ["neptu:read", "neptu:ai"] as const;

export type OAuthScope = (typeof OAUTH_SCOPES)[number];

export const OAUTH_SCOPE_DESCRIPTIONS: Record<OAuthScope, string> = {
  "neptu:read":
    "Read basic Wariga calculator data (Potensi, Peluang, Compatibility)",
  "neptu:ai": "Access AI-enhanced readings (Oracle, Interpretation, Chat)",
} as const;

// ---------------------------------------------------------------------------
// Grant Types
// ---------------------------------------------------------------------------

export const OAUTH_GRANT_TYPES = [
  "authorization_code",
  "client_credentials",
  "refresh_token",
] as const;

export type OAuthGrantType = (typeof OAUTH_GRANT_TYPES)[number];

// ---------------------------------------------------------------------------
// Code Challenge Methods (PKCE) — only S256 is supported
// ---------------------------------------------------------------------------

export const OAUTH_CODE_CHALLENGE_METHODS = ["S256"] as const;

export type OAuthCodeChallengeMethod =
  (typeof OAUTH_CODE_CHALLENGE_METHODS)[number];

/** PKCE code verifier minimum raw bytes per RFC 7636 */
const PKCE_MIN_VERIFIER_BYTES = 32;

/** PKCE code verifier / challenge min length per RFC 7636 (base64url-encoded) */
export const OAUTH_CODE_VERIFIER_MIN_LENGTH = Math.ceil(
  (PKCE_MIN_VERIFIER_BYTES * 4) / 3
);

/** PKCE code verifier / challenge max length per RFC 7636 */
export const OAUTH_CODE_VERIFIER_MAX_LENGTH = 128 as const;

// ---------------------------------------------------------------------------
// Token TTLs
// ---------------------------------------------------------------------------

/** OAuth access token TTL in seconds (1 hour) */
export const OAUTH_ACCESS_TOKEN_TTL = 3600;

/** OAuth refresh token TTL in seconds (30 days) */
export const OAUTH_REFRESH_TOKEN_TTL = 2_592_000;

/** OAuth authorization code TTL in seconds (10 minutes) */
export const OAUTH_AUTHORIZATION_CODE_TTL = 600;

// ---------------------------------------------------------------------------
// Client ID prefix
// ---------------------------------------------------------------------------

export const OAUTH_CLIENT_ID_PREFIX = "nptu_client_" as const;

export const OAUTH_CLIENT_ID_LENGTH = 24 as const;

export const OAUTH_CLIENT_SECRET_LENGTH = (OAUTH_CLIENT_ID_LENGTH * 2) as const;

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** Maximum number of OAuth clients a developer can create */
export const OAUTH_MAX_CLIENTS_PER_USER = 10 as const;

/** Maximum number of redirect URIs per OAuth client */
export const OAUTH_MAX_REDIRECT_URIS = 5 as const;

/** Maximum number of scopes per OAuth client */
export const OAUTH_MAX_SCOPES = 2;

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------

export const OAUTH_RESPONSE_TYPES = ["code"] as const;

export type OAuthResponseType = (typeof OAUTH_RESPONSE_TYPES)[number];

// ---------------------------------------------------------------------------
// Token Types
// ---------------------------------------------------------------------------

export const OAUTH_TOKEN_TYPE = "Bearer" as const;

export const OAUTH_JWT_ISSUER = "https://api.neptu.sudigital.com" as const;

// ---------------------------------------------------------------------------
// Webhook Events
// ---------------------------------------------------------------------------

export const OAUTH_WEBHOOK_EVENTS = [
  "token.created",
  "token.revoked",
  "client.updated",
  "client.deleted",
  "authorization.granted",
  "authorization.denied",
] as const;

export type OAuthWebhookEvent = (typeof OAUTH_WEBHOOK_EVENTS)[number];

export const OAUTH_WEBHOOK_EVENT_DESCRIPTIONS: Record<
  OAuthWebhookEvent,
  string
> = {
  "token.created": "A new access token was issued",
  "token.revoked": "An access or refresh token was revoked",
  "client.updated": "OAuth client settings were updated",
  "client.deleted": "OAuth client was deleted",
  "authorization.granted": "A user granted authorization to the client",
  "authorization.denied": "A user denied authorization to the client",
} as const;

export const OAUTH_MAX_WEBHOOKS_PER_CLIENT = 5 as const;

export const OAUTH_WEBHOOK_MAX_RETRIES = 3 as const;

export const OAUTH_WEBHOOK_SECRET_LENGTH = 32 as const;
