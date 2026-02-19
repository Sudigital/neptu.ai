import {
  OAUTH_CLIENT_ID_LENGTH,
  OAUTH_CLIENT_ID_PREFIX,
  OAUTH_CLIENT_SECRET_LENGTH,
  OAUTH_MAX_CLIENTS_PER_USER,
  type OAuthScope,
} from "@neptu/shared";

import type { Database } from "../client";

import {
  toOAuthClientDTO,
  type OAuthClientDTO,
  type OAuthClientWithSecretDTO,
} from "../dto/oauth-dto";
import { OAuthClientRepository } from "../repositories/oauth-client-repository";
import {
  createOAuthClientSchema,
  updateOAuthClientSchema,
  type CreateOAuthClientInput,
  type UpdateOAuthClientInput,
} from "../validators/oauth-validator";

export class OAuthClientService {
  private repository: OAuthClientRepository;

  constructor(db: Database) {
    this.repository = new OAuthClientRepository(db);
  }

  private generateRandomString(length: number): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }

  private async hashSecret(secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async verifySecret(secret: string, hash: string): Promise<boolean> {
    const computed = await this.hashSecret(secret);
    return computed === hash;
  }

  async createClient(
    userId: string,
    input: CreateOAuthClientInput
  ): Promise<OAuthClientWithSecretDTO> {
    const validated = createOAuthClientSchema.parse(input);

    const clientCount = await this.repository.countByUserId(userId);
    if (clientCount >= OAUTH_MAX_CLIENTS_PER_USER) {
      throw new Error(
        `Maximum of ${OAUTH_MAX_CLIENTS_PER_USER} OAuth clients allowed per user`
      );
    }

    const clientId = `${OAUTH_CLIENT_ID_PREFIX}${this.generateRandomString(OAUTH_CLIENT_ID_LENGTH)}`;
    const clientSecret = this.generateRandomString(OAUTH_CLIENT_SECRET_LENGTH);
    const clientSecretHash = await this.hashSecret(clientSecret);
    const id = crypto.randomUUID();

    const client = await this.repository.create({
      id,
      userId,
      clientId,
      clientSecretHash,
      name: validated.name,
      description: validated.description ?? null,
      logoUrl: validated.logoUrl ?? null,
      redirectUris: validated.redirectUris,
      scopes: validated.scopes,
      grantTypes: validated.grantTypes,
      isConfidential: validated.isConfidential,
      isActive: true,
    });

    return {
      ...toOAuthClientDTO(client),
      clientSecret,
    };
  }

  async getClientById(id: string): Promise<OAuthClientDTO | null> {
    const client = await this.repository.findById(id);
    return client ? toOAuthClientDTO(client) : null;
  }

  async getClientByClientId(clientId: string): Promise<OAuthClientDTO | null> {
    const client = await this.repository.findByClientId(clientId);
    return client ? toOAuthClientDTO(client) : null;
  }

  async getClientsByUserId(userId: string): Promise<OAuthClientDTO[]> {
    const clients = await this.repository.findByUserId(userId);
    return clients.map(toOAuthClientDTO);
  }

  async updateClient(
    id: string,
    userId: string,
    input: UpdateOAuthClientInput
  ): Promise<OAuthClientDTO | null> {
    const validated = updateOAuthClientSchema.parse(input);
    const existing = await this.repository.findById(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updated = await this.repository.update(id, validated);
    return updated ? toOAuthClientDTO(updated) : null;
  }

  async rotateSecret(
    id: string,
    userId: string
  ): Promise<OAuthClientWithSecretDTO | null> {
    const existing = await this.repository.findById(id);
    if (!existing || existing.userId !== userId) {
      return null;
    }

    const newSecret = this.generateRandomString(OAUTH_CLIENT_SECRET_LENGTH);
    const newHash = await this.hashSecret(newSecret);

    const updated = await this.repository.update(id, {
      clientSecretHash: newHash,
    });

    if (!updated) return null;

    return {
      ...toOAuthClientDTO(updated),
      clientSecret: newSecret,
    };
  }

  async deleteClient(id: string, userId: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing || existing.userId !== userId) {
      return false;
    }
    return this.repository.delete(id);
  }

  async validateClientCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<OAuthClientDTO | null> {
    const client = await this.repository.findActiveByClientId(clientId);
    if (!client) return null;

    const valid = await this.verifySecret(
      clientSecret,
      client.clientSecretHash
    );
    if (!valid) return null;

    return toOAuthClientDTO(client);
  }

  async validateRedirectUri(
    clientId: string,
    redirectUri: string
  ): Promise<boolean> {
    const client = await this.repository.findActiveByClientId(clientId);
    if (!client) return false;

    const uris = client.redirectUris as string[];
    return uris.includes(redirectUri);
  }

  async validateScopes(
    clientId: string,
    requestedScopes: OAuthScope[]
  ): Promise<boolean> {
    const client = await this.repository.findActiveByClientId(clientId);
    if (!client) return false;

    const clientScopes = client.scopes as OAuthScope[];
    return requestedScopes.every((s) => clientScopes.includes(s));
  }
}
