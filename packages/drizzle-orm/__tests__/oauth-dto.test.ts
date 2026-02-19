import { describe, test, expect } from "bun:test";

import type { OAuthClient } from "../src/schemas/oauth-clients";

import { toOAuthClientDTO, type OAuthClientDTO } from "../src/dto/oauth-dto";

const mockClient: OAuthClient = {
  id: "test-id-123",
  userId: "user-id-456",
  clientId: "nptu_client_abc123",
  clientSecretHash: "hashed-secret-value",
  name: "Test OAuth App",
  description: "A test app",
  logoUrl: "https://myapp.com/logo.png",
  redirectUris: ["https://myapp.com/callback", "https://myapp.com/callback2"],
  scopes: ["neptu:read", "neptu:ai"],
  grantTypes: ["authorization_code", "client_credentials"],
  isConfidential: true,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
};

describe("OAuth DTO", () => {
  describe("toOAuthClientDTO", () => {
    test("should transform OAuthClient to DTO", () => {
      const dto = toOAuthClientDTO(mockClient);

      expect(dto.id).toBe("test-id-123");
      expect(dto.userId).toBe("user-id-456");
      expect(dto.clientId).toBe("nptu_client_abc123");
      expect(dto.name).toBe("Test OAuth App");
      expect(dto.description).toBe("A test app");
      expect(dto.logoUrl).toBe("https://myapp.com/logo.png");
      expect(dto.redirectUris).toEqual([
        "https://myapp.com/callback",
        "https://myapp.com/callback2",
      ]);
      expect(dto.scopes).toEqual(["neptu:read", "neptu:ai"]);
      expect(dto.grantTypes).toEqual([
        "authorization_code",
        "client_credentials",
      ]);
      expect(dto.isConfidential).toBe(true);
      expect(dto.isActive).toBe(true);
      expect(dto.createdAt).toBe("2026-01-01T00:00:00.000Z");
      expect(dto.updatedAt).toBe("2026-01-15T00:00:00.000Z");
    });

    test("should not expose clientSecretHash", () => {
      const dto = toOAuthClientDTO(mockClient) as unknown as Record<
        string,
        unknown
      >;

      expect(dto.clientSecretHash).toBeUndefined();
    });

    test("should handle null optional fields", () => {
      const clientNoOptionals: OAuthClient = {
        ...mockClient,
        description: null,
        logoUrl: null,
      };

      const dto = toOAuthClientDTO(clientNoOptionals);

      expect(dto.description).toBeNull();
      expect(dto.logoUrl).toBeNull();
    });
  });
});
