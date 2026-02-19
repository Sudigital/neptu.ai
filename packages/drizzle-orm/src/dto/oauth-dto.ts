import type { OAuthGrantType, OAuthScope } from "@neptu/shared";

import type { OAuthClient } from "../schemas/oauth-clients";

export interface OAuthClientDTO {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  redirectUris: string[];
  scopes: OAuthScope[];
  grantTypes: OAuthGrantType[];
  isConfidential: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthClientWithSecretDTO extends OAuthClientDTO {
  clientSecret: string;
}

export interface OAuthConsentDTO {
  client: {
    name: string;
    description: string | null;
    logoUrl: string | null;
  };
  requestedScopes: OAuthScope[];
  redirectUri: string;
  state: string;
}

export function toOAuthClientDTO(client: OAuthClient): OAuthClientDTO {
  return {
    id: client.id,
    userId: client.userId,
    clientId: client.clientId,
    name: client.name,
    description: client.description,
    logoUrl: client.logoUrl,
    redirectUris: (client.redirectUris ?? []) as string[],
    scopes: (client.scopes ?? []) as OAuthScope[],
    grantTypes: (client.grantTypes ?? []) as OAuthGrantType[],
    isConfidential: client.isConfidential,
    isActive: client.isActive,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
