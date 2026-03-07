import type { Database } from "../client";

import {
  toMarketCategoryDTO,
  type MarketCategoryDTO,
} from "../dto/market-category-dto";
import { MarketCategoryRepository } from "../repositories/market-category-repository";
import {
  createMarketCategorySchema,
  updateMarketCategorySchema,
  type CreateMarketCategoryInput,
  type UpdateMarketCategoryInput,
} from "../validators/market-category-validator";

export class MarketCategoryService {
  private repository: MarketCategoryRepository;

  constructor(db: Database) {
    this.repository = new MarketCategoryRepository(db);
  }

  async create(input: CreateMarketCategoryInput): Promise<MarketCategoryDTO> {
    const validated = createMarketCategorySchema.parse(input);
    const id = crypto.randomUUID();

    const row = await this.repository.create({
      id,
      name: validated.name,
      slug: validated.slug,
      description: validated.description ?? null,
      icon: validated.icon ?? null,
      color: validated.color ?? null,
      category: validated.category,
      personTags: validated.personTags,
      isActive: validated.isActive ?? true,
      sortOrder: validated.sortOrder ?? 0,
    });

    return toMarketCategoryDTO(row);
  }

  async getById(id: string): Promise<MarketCategoryDTO | null> {
    const row = await this.repository.findById(id);
    return row ? toMarketCategoryDTO(row) : null;
  }

  async getBySlug(slug: string): Promise<MarketCategoryDTO | null> {
    const row = await this.repository.findBySlug(slug);
    return row ? toMarketCategoryDTO(row) : null;
  }

  async getAll(): Promise<MarketCategoryDTO[]> {
    const rows = await this.repository.findAll();
    return rows.map(toMarketCategoryDTO);
  }

  async getActive(): Promise<MarketCategoryDTO[]> {
    const rows = await this.repository.findActive();
    return rows.map(toMarketCategoryDTO);
  }

  async update(
    id: string,
    input: UpdateMarketCategoryInput
  ): Promise<MarketCategoryDTO | null> {
    const validated = updateMarketCategorySchema.parse(input);
    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.icon !== undefined) updateData.icon = validated.icon;
    if (validated.color !== undefined) updateData.color = validated.color;
    if (validated.category !== undefined)
      updateData.category = validated.category;
    if (validated.personTags !== undefined)
      updateData.personTags = validated.personTags;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;
    if (validated.sortOrder !== undefined)
      updateData.sortOrder = validated.sortOrder;

    const row = await this.repository.update(id, updateData);
    return row ? toMarketCategoryDTO(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
