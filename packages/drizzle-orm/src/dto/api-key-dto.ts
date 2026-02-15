import type { ApiKey } from "../schemas/api-keys";

export interface ApiKeyDTO {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  planId: string | null;
  scopes: string[];
  allowedOrigins: string[] | null;
  allowedIps: string[] | null;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyWithSecretDTO extends ApiKeyDTO {
  secret: string;
}

export function toApiKeyDTO(key: ApiKey): ApiKeyDTO {
  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    keyPrefix: key.keyPrefix,
    planId: key.planId,
    scopes: (key.scopes ?? []) as string[],
    allowedOrigins: key.allowedOrigins as string[] | null,
    allowedIps: key.allowedIps as string[] | null,
    isActive: key.isActive ?? true,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    expiresAt: key.expiresAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
    updatedAt: key.updatedAt.toISOString(),
  };
}
