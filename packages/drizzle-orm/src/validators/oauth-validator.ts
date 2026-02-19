import {
  OAUTH_CODE_CHALLENGE_METHODS,
  OAUTH_CODE_VERIFIER_MAX_LENGTH,
  OAUTH_CODE_VERIFIER_MIN_LENGTH,
  OAUTH_GRANT_TYPES,
  OAUTH_MAX_REDIRECT_URIS,
  OAUTH_SCOPES,
} from "@neptu/shared";
import { z } from "zod";

// ---------------------------------------------------------------------------
// OAuth Scopes
// ---------------------------------------------------------------------------

export const oauthScopesSchema = z
  .array(z.enum(OAUTH_SCOPES))
  .min(1, "At least one scope is required");

// ---------------------------------------------------------------------------
// OAuth Client
// ---------------------------------------------------------------------------

export const createOAuthClientSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  redirectUris: z
    .array(z.string().url())
    .min(1, "At least one redirect URI is required")
    .max(OAUTH_MAX_REDIRECT_URIS),
  scopes: oauthScopesSchema,
  grantTypes: z
    .array(z.enum(OAUTH_GRANT_TYPES))
    .min(1, "At least one grant type is required"),
  isConfidential: z.boolean().default(true),
});

export const updateOAuthClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  redirectUris: z
    .array(z.string().url())
    .min(1)
    .max(OAUTH_MAX_REDIRECT_URIS)
    .optional(),
  scopes: oauthScopesSchema.optional(),
  grantTypes: z.array(z.enum(OAUTH_GRANT_TYPES)).min(1).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Authorization Request (GET /oauth/authorize query params)
// ---------------------------------------------------------------------------

export const authorizeRequestSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().min(1),
  state: z.string().min(1),
  code_challenge: z
    .string()
    .min(OAUTH_CODE_VERIFIER_MIN_LENGTH)
    .max(OAUTH_CODE_VERIFIER_MAX_LENGTH),
  code_challenge_method: z.enum(OAUTH_CODE_CHALLENGE_METHODS),
});

// ---------------------------------------------------------------------------
// Authorization Decision (POST /oauth/authorize — user approves/denies)
// ---------------------------------------------------------------------------

export const authorizeDecisionSchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().min(1),
  state: z.string().min(1),
  code_challenge: z
    .string()
    .min(OAUTH_CODE_VERIFIER_MIN_LENGTH)
    .max(OAUTH_CODE_VERIFIER_MAX_LENGTH),
  code_challenge_method: z.enum(OAUTH_CODE_CHALLENGE_METHODS),
  approved: z.boolean(),
});

// ---------------------------------------------------------------------------
// Token Exchange (POST /oauth/token)
// ---------------------------------------------------------------------------

const authorizationCodeTokenSchema = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string().min(1),
  redirect_uri: z.string().url(),
  client_id: z.string().min(1),
  client_secret: z.string().optional(),
  code_verifier: z
    .string()
    .min(OAUTH_CODE_VERIFIER_MIN_LENGTH)
    .max(OAUTH_CODE_VERIFIER_MAX_LENGTH),
});

const clientCredentialsTokenSchema = z.object({
  grant_type: z.literal("client_credentials"),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  scope: z.string().optional(),
});

const refreshTokenSchema = z.object({
  grant_type: z.literal("refresh_token"),
  refresh_token: z.string().min(1),
  client_id: z.string().min(1),
  client_secret: z.string().optional(),
  scope: z.string().optional(),
});

export const tokenRequestSchema = z.discriminatedUnion("grant_type", [
  authorizationCodeTokenSchema,
  clientCredentialsTokenSchema,
  refreshTokenSchema,
]);

// ---------------------------------------------------------------------------
// Token Revocation (POST /oauth/revoke — RFC 7009)
// ---------------------------------------------------------------------------

export const revokeTokenSchema = z.object({
  token: z.string().min(1),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
  client_id: z.string().min(1),
  client_secret: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CreateOAuthClientInput = z.infer<typeof createOAuthClientSchema>;
export type UpdateOAuthClientInput = z.infer<typeof updateOAuthClientSchema>;
export type AuthorizeRequestInput = z.infer<typeof authorizeRequestSchema>;
export type AuthorizeDecisionInput = z.infer<typeof authorizeDecisionSchema>;
export type TokenRequestInput = z.infer<typeof tokenRequestSchema>;
export type RevokeTokenInput = z.infer<typeof revokeTokenSchema>;
