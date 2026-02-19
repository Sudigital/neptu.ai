import { describe, test, expect } from "bun:test";

import {
  createOAuthClientSchema,
  updateOAuthClientSchema,
  authorizeRequestSchema,
  authorizeDecisionSchema,
  tokenRequestSchema,
  revokeTokenSchema,
} from "../src/validators/oauth-validator";

describe("OAuth Validators", () => {
  describe("createOAuthClientSchema", () => {
    test("should validate a valid create input", () => {
      const input = {
        name: "My App",
        description: "A test OAuth app",
        redirectUris: ["https://myapp.com/callback"],
        scopes: ["neptu:read" as const],
        grantTypes: ["authorization_code" as const],
        isConfidential: true,
      };

      const result = createOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should reject empty name", () => {
      const input = {
        name: "",
        redirectUris: ["https://myapp.com/callback"],
        scopes: ["neptu:read" as const],
        grantTypes: ["authorization_code" as const],
      };

      const result = createOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should reject invalid redirect URIs", () => {
      const input = {
        name: "My App",
        redirectUris: ["not-a-url"],
        scopes: ["neptu:read" as const],
        grantTypes: ["authorization_code" as const],
      };

      const result = createOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should reject empty scopes", () => {
      const input = {
        name: "My App",
        redirectUris: ["https://myapp.com/callback"],
        scopes: [],
        grantTypes: ["authorization_code" as const],
      };

      const result = createOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should reject invalid scopes", () => {
      const input = {
        name: "My App",
        redirectUris: ["https://myapp.com/callback"],
        scopes: ["invalid:scope"],
        grantTypes: ["authorization_code" as const],
      };

      const result = createOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should reject too many redirect URIs", () => {
      const input = {
        name: "My App",
        redirectUris: [
          "https://a.com/cb",
          "https://b.com/cb",
          "https://c.com/cb",
          "https://d.com/cb",
          "https://e.com/cb",
          "https://f.com/cb",
        ],
        scopes: ["neptu:read" as const],
        grantTypes: ["authorization_code" as const],
      };

      const result = createOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should accept multiple scopes", () => {
      const input = {
        name: "AI App",
        redirectUris: ["https://myapp.com/callback"],
        scopes: ["neptu:read" as const, "neptu:ai" as const],
        grantTypes: [
          "authorization_code" as const,
          "client_credentials" as const,
        ],
      };

      const result = createOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("updateOAuthClientSchema", () => {
    test("should validate partial update", () => {
      const input = { name: "Updated Name" };

      const result = updateOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should validate isActive toggle", () => {
      const input = { isActive: false };

      const result = updateOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should allow nullable description", () => {
      const input = { description: null };

      const result = updateOAuthClientSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("authorizeRequestSchema", () => {
    test("should validate a valid authorization request", () => {
      const input = {
        response_type: "code",
        client_id: "nptu_client_abc123",
        redirect_uri: "https://myapp.com/callback",
        scope: "neptu:read",
        state: "random-state-value",
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM_",
        code_challenge_method: "S256",
      };

      const result = authorizeRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should reject non-code response type", () => {
      const input = {
        response_type: "token",
        client_id: "nptu_client_abc123",
        redirect_uri: "https://myapp.com/callback",
        scope: "neptu:read",
        state: "random-state-value",
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM_",
        code_challenge_method: "S256",
      };

      const result = authorizeRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should reject missing code_challenge", () => {
      const input = {
        response_type: "code",
        client_id: "nptu_client_abc123",
        redirect_uri: "https://myapp.com/callback",
        scope: "neptu:read",
        state: "random-state-value",
        code_challenge_method: "S256",
      };

      const result = authorizeRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should reject short code_challenge", () => {
      const input = {
        response_type: "code",
        client_id: "nptu_client_abc123",
        redirect_uri: "https://myapp.com/callback",
        scope: "neptu:read",
        state: "random-state-value",
        code_challenge: "too-short",
        code_challenge_method: "S256",
      };

      const result = authorizeRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("authorizeDecisionSchema", () => {
    test("should validate approval", () => {
      const input = {
        client_id: "nptu_client_abc123",
        redirect_uri: "https://myapp.com/callback",
        scope: "neptu:read",
        state: "random-state-value",
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM_",
        code_challenge_method: "S256" as const,
        approved: true,
      };

      const result = authorizeDecisionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should validate denial", () => {
      const input = {
        client_id: "nptu_client_abc123",
        redirect_uri: "https://myapp.com/callback",
        scope: "neptu:read",
        state: "random-state-value",
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM_",
        code_challenge_method: "S256" as const,
        approved: false,
      };

      const result = authorizeDecisionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("tokenRequestSchema", () => {
    test("should validate authorization_code grant", () => {
      const input = {
        grant_type: "authorization_code" as const,
        code: "auth-code-value",
        redirect_uri: "https://myapp.com/callback",
        client_id: "nptu_client_abc123",
        code_verifier:
          "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk_somePadding",
      };

      const result = tokenRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should validate client_credentials grant", () => {
      const input = {
        grant_type: "client_credentials" as const,
        client_id: "nptu_client_abc123",
        client_secret: "secret-value",
      };

      const result = tokenRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should validate refresh_token grant", () => {
      const input = {
        grant_type: "refresh_token" as const,
        refresh_token: "refresh-token-value",
        client_id: "nptu_client_abc123",
      };

      const result = tokenRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should reject unknown grant type", () => {
      const input = {
        grant_type: "implicit",
        client_id: "nptu_client_abc123",
      };

      const result = tokenRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("should reject auth code grant without code_verifier", () => {
      const input = {
        grant_type: "authorization_code" as const,
        code: "auth-code-value",
        redirect_uri: "https://myapp.com/callback",
        client_id: "nptu_client_abc123",
      };

      const result = tokenRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("revokeTokenSchema", () => {
    test("should validate a revoke request", () => {
      const input = {
        token: "some-token-value",
        client_id: "nptu_client_abc123",
      };

      const result = revokeTokenSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should validate with token_type_hint", () => {
      const input = {
        token: "some-token-value",
        token_type_hint: "access_token" as const,
        client_id: "nptu_client_abc123",
      };

      const result = revokeTokenSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("should reject invalid token_type_hint", () => {
      const input = {
        token: "some-token-value",
        token_type_hint: "invalid",
        client_id: "nptu_client_abc123",
      };

      const result = revokeTokenSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
