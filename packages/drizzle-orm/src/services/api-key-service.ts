import type { Database } from "../client";

import {
  toApiKeyDTO,
  type ApiKeyDTO,
  type ApiKeyWithSecretDTO,
} from "../dto/api-key-dto";
import {
  ApiKeyRepository,
  type ListApiKeysOptions,
  type PaginatedResult,
} from "../repositories/api-key-repository";
import {
  createApiKeySchema,
  updateApiKeySchema,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
} from "../validators/api-key-validator";

export class ApiKeyService {
  private repository: ApiKeyRepository;

  constructor(db: Database) {
    this.repository = new ApiKeyRepository(db);
  }

  private generateApiKey(): { key: string; prefix: string; hash: string } {
    const prefix = `nptu_${this.generateRandomString(8)}`;
    const secret = this.generateRandomString(32);
    const key = `${prefix}_${secret}`;
    const hash = this.hashKey(key);
    return { key, prefix, hash };
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

  private hashKey(key: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }

  async createKey(
    userId: string,
    input: CreateApiKeyInput,
    planId?: string
  ): Promise<ApiKeyWithSecretDTO> {
    const validated = createApiKeySchema.parse(input);
    const { key, prefix, hash } = this.generateApiKey();
    const id = crypto.randomUUID();

    const apiKey = await this.repository.create({
      id,
      userId,
      name: validated.name,
      keyHash: hash,
      keyPrefix: prefix,
      planId: planId ?? null,
      scopes: validated.scopes,
      allowedOrigins: validated.allowedOrigins ?? null,
      allowedIps: validated.allowedIps ?? null,
      isActive: true,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
    });

    return {
      ...toApiKeyDTO(apiKey),
      secret: key,
    };
  }

  async getKeyById(id: string): Promise<ApiKeyDTO | null> {
    const key = await this.repository.findById(id);
    return key ? toApiKeyDTO(key) : null;
  }

  async getKeysByUserId(userId: string): Promise<ApiKeyDTO[]> {
    const keys = await this.repository.findByUserId(userId);
    return keys.map(toApiKeyDTO);
  }

  async getActiveKeysByUserId(userId: string): Promise<ApiKeyDTO[]> {
    const keys = await this.repository.findActiveByUserId(userId);
    return keys.map(toApiKeyDTO);
  }

  async validateKey(apiKey: string): Promise<ApiKeyDTO | null> {
    const hash = this.hashKey(apiKey);
    const key = await this.repository.findByKeyHash(hash);

    if (!key) return null;
    if (!key.isActive) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;

    await this.repository.updateLastUsed(key.id);
    return toApiKeyDTO(key);
  }

  async updateKey(
    id: string,
    userId: string,
    input: UpdateApiKeyInput
  ): Promise<ApiKeyDTO | null> {
    const existingKey = await this.repository.findById(id);
    if (!existingKey || existingKey.userId !== userId) return null;

    const validated = updateApiKeySchema.parse(input);
    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.scopes !== undefined) updateData.scopes = validated.scopes;
    if (validated.allowedOrigins !== undefined)
      updateData.allowedOrigins = validated.allowedOrigins;
    if (validated.allowedIps !== undefined)
      updateData.allowedIps = validated.allowedIps;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;
    if (validated.expiresAt !== undefined)
      updateData.expiresAt = validated.expiresAt
        ? new Date(validated.expiresAt)
        : null;

    const key = await this.repository.update(id, updateData);
    return key ? toApiKeyDTO(key) : null;
  }

  async revokeKey(id: string, userId?: string): Promise<boolean> {
    const existingKey = await this.repository.findById(id);
    if (!existingKey) return false;
    // If userId provided, require ownership match
    if (userId && existingKey.userId !== userId) return false;

    await this.repository.deactivate(id);
    return true;
  }

  async deleteKey(id: string, userId: string): Promise<boolean> {
    const existingKey = await this.repository.findById(id);
    if (!existingKey || existingKey.userId !== userId) return false;

    return this.repository.delete(id);
  }

  // Admin methods
  async listKeys(
    options: ListApiKeysOptions
  ): Promise<PaginatedResult<ApiKeyDTO>> {
    const result = await this.repository.list(options);
    return {
      ...result,
      data: result.data.map(toApiKeyDTO),
    };
  }
}
