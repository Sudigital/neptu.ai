import type { Database } from "../client";

import {
  toApiCreditPackDTO,
  type ApiCreditPackDTO,
} from "../dto/api-credit-pack-dto";
import { ApiCreditPackRepository } from "../repositories/api-credit-pack-repository";
import {
  createApiCreditPackSchema,
  updateApiCreditPackSchema,
  type CreateApiCreditPackInput,
  type UpdateApiCreditPackInput,
} from "../validators/api-credit-pack-validator";

export class ApiCreditPackService {
  private repository: ApiCreditPackRepository;

  constructor(db: Database) {
    this.repository = new ApiCreditPackRepository(db);
  }

  async createPack(input: CreateApiCreditPackInput): Promise<ApiCreditPackDTO> {
    const validated = createApiCreditPackSchema.parse(input);
    const id = crypto.randomUUID();

    const pack = await this.repository.create({
      id,
      name: validated.name,
      slug: validated.slug,
      description: validated.description ?? null,
      credits: validated.credits,
      aiCredits: validated.aiCredits,
      priceUsd: validated.priceUsd.toString(),
      priceSol: validated.priceSol?.toString() ?? null,
      priceNeptu: validated.priceNeptu?.toString() ?? null,
      bonusPercent: validated.bonusPercent ?? 0,
      isActive: validated.isActive ?? true,
      sortOrder: validated.sortOrder ?? 0,
    });

    return toApiCreditPackDTO(pack);
  }

  async getPackById(id: string): Promise<ApiCreditPackDTO | null> {
    const pack = await this.repository.findById(id);
    return pack ? toApiCreditPackDTO(pack) : null;
  }

  async getPackBySlug(slug: string): Promise<ApiCreditPackDTO | null> {
    const pack = await this.repository.findBySlug(slug);
    return pack ? toApiCreditPackDTO(pack) : null;
  }

  async getAllPacks(): Promise<ApiCreditPackDTO[]> {
    const packs = await this.repository.findAll();
    return packs.map(toApiCreditPackDTO);
  }

  async getActivePacks(): Promise<ApiCreditPackDTO[]> {
    const packs = await this.repository.findActive();
    return packs.map(toApiCreditPackDTO);
  }

  async updatePack(
    id: string,
    input: UpdateApiCreditPackInput
  ): Promise<ApiCreditPackDTO | null> {
    const validated = updateApiCreditPackSchema.parse(input);
    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.credits !== undefined) updateData.credits = validated.credits;
    if (validated.aiCredits !== undefined)
      updateData.aiCredits = validated.aiCredits;
    if (validated.priceUsd !== undefined)
      updateData.priceUsd = validated.priceUsd.toString();
    if (validated.priceSol !== undefined)
      updateData.priceSol = validated.priceSol?.toString();
    if (validated.priceNeptu !== undefined)
      updateData.priceNeptu = validated.priceNeptu?.toString();
    if (validated.bonusPercent !== undefined)
      updateData.bonusPercent = validated.bonusPercent;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;
    if (validated.sortOrder !== undefined)
      updateData.sortOrder = validated.sortOrder;

    const pack = await this.repository.update(id, updateData);
    return pack ? toApiCreditPackDTO(pack) : null;
  }

  async deletePack(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async seedDefaultPacks(): Promise<void> {
    const existing = await this.repository.findAll();
    if (existing.length > 0) return;

    const defaultPacks: CreateApiCreditPackInput[] = [
      {
        name: "Starter Pack",
        slug: "starter-pack",
        description: "Try out the API with basic credits",
        credits: 500,
        aiCredits: 50,
        priceUsd: 7.5,
        priceSol: 0.05,
        priceNeptu: 50,
        bonusPercent: 0,
        isActive: true,
        sortOrder: 0,
      },
      {
        name: "Growth Pack",
        slug: "growth-pack",
        description: "For growing applications",
        credits: 5000,
        aiCredits: 500,
        priceUsd: 60,
        priceSol: 0.4,
        priceNeptu: 400,
        bonusPercent: 10,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Scale Pack",
        slug: "scale-pack",
        description: "High-volume credit pack",
        credits: 50000,
        aiCredits: 5000,
        priceUsd: 450,
        priceSol: 3,
        priceNeptu: 3000,
        bonusPercent: 20,
        isActive: true,
        sortOrder: 2,
      },
    ];

    for (const pack of defaultPacks) {
      await this.createPack(pack);
    }
  }
}
