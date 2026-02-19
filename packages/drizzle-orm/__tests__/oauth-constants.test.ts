import { describe, test, expect } from "bun:test";

import {
  OAUTH_SCOPES,
  OAUTH_GRANT_TYPES,
  OAUTH_CODE_CHALLENGE_METHODS,
  OAUTH_ACCESS_TOKEN_TTL,
  OAUTH_REFRESH_TOKEN_TTL,
  OAUTH_AUTHORIZATION_CODE_TTL,
  OAUTH_CLIENT_ID_PREFIX,
  OAUTH_MAX_CLIENTS_PER_USER,
  OAUTH_MAX_REDIRECT_URIS,
  OAUTH_JWT_ISSUER,
  OAUTH_TOKEN_TYPE,
  OAUTH_RESPONSE_TYPES,
  OAUTH_SCOPE_DESCRIPTIONS,
} from "@neptu/shared";

describe("OAuth Constants", () => {
  test("OAUTH_SCOPES should have the expected values", () => {
    expect(OAUTH_SCOPES).toEqual(["neptu:read", "neptu:ai"]);
  });

  test("OAUTH_GRANT_TYPES should support auth code, client creds, and refresh", () => {
    expect(OAUTH_GRANT_TYPES).toEqual([
      "authorization_code",
      "client_credentials",
      "refresh_token",
    ]);
  });

  test("OAUTH_CODE_CHALLENGE_METHODS should only support S256", () => {
    expect(OAUTH_CODE_CHALLENGE_METHODS).toEqual(["S256"]);
  });

  test("OAUTH_ACCESS_TOKEN_TTL should be 1 hour (3600 seconds)", () => {
    expect(OAUTH_ACCESS_TOKEN_TTL).toBe(3600);
  });

  test("OAUTH_REFRESH_TOKEN_TTL should be 30 days", () => {
    expect(OAUTH_REFRESH_TOKEN_TTL).toBe(30 * 86400);
  });

  test("OAUTH_AUTHORIZATION_CODE_TTL should be 10 minutes", () => {
    expect(OAUTH_AUTHORIZATION_CODE_TTL).toBe(600);
  });

  test("OAUTH_CLIENT_ID_PREFIX should be nptu_client_", () => {
    expect(OAUTH_CLIENT_ID_PREFIX).toBe("nptu_client_");
  });

  test("OAUTH_MAX_CLIENTS_PER_USER should be 10", () => {
    expect(OAUTH_MAX_CLIENTS_PER_USER).toBe(10);
  });

  test("OAUTH_MAX_REDIRECT_URIS should be 5", () => {
    expect(OAUTH_MAX_REDIRECT_URIS).toBe(5);
  });

  test("OAUTH_TOKEN_TYPE should be Bearer", () => {
    expect(OAUTH_TOKEN_TYPE).toBe("Bearer");
  });

  test("OAUTH_RESPONSE_TYPES should only support code", () => {
    expect(OAUTH_RESPONSE_TYPES).toEqual(["code"]);
  });

  test("OAUTH_JWT_ISSUER should be set", () => {
    expect(OAUTH_JWT_ISSUER).toBeTruthy();
    expect(OAUTH_JWT_ISSUER).toContain("neptu");
  });

  test("All scopes should have descriptions", () => {
    for (const scope of OAUTH_SCOPES) {
      expect(OAUTH_SCOPE_DESCRIPTIONS[scope]).toBeTruthy();
    }
  });
});
