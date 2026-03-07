import { PERSON_CATEGORIES, PERSON_LIMITS } from "@neptu/shared";

import type { Database } from "../client";

import {
  toPersonDTO,
  toPersonDTOList,
  type PersonDTO,
} from "../dto/person-dto";
import {
  PersonRepository,
  type FindPersonsOptions,
} from "../repositories/person-repository";
import {
  createPersonSchema,
  updatePersonSchema,
  type CreatePersonInput,
  type UpdatePersonInput,
} from "../validators/person-validator";

export interface PersonStats {
  total: number;
  byCategory: Record<string, number>;
}

export class PersonService {
  private repo: PersonRepository;

  constructor(db: Database) {
    this.repo = new PersonRepository(db);
  }

  async create(input: CreatePersonInput): Promise<PersonDTO> {
    const validated = createPersonSchema.parse(input);
    const id = crypto.randomUUID();

    const figure = await this.repo.create({
      id,
      name: validated.name,
      lastName: validated.lastName ?? null,
      slug: validated.slug ?? null,
      birthday: validated.birthday,
      gender: validated.gender ?? null,
      categories: validated.categories,
      nationality: validated.nationality ?? null,
      title: validated.title ?? null,
      description: validated.description ?? null,
      imageUrl: validated.imageUrl ?? null,
      thumbnailUrl: validated.thumbnailUrl ?? null,
      wikidataId: validated.wikidataId ?? null,
      wikipediaUrl: validated.wikipediaUrl ?? null,
      tags: validated.tags ?? [],
      popularity: validated.popularity ?? null,
      source: validated.source,
      sourceUrl: validated.sourceUrl ?? null,
      wukuData: validated.wukuData ?? null,
      city: validated.city ?? null,
      state: validated.state ?? null,
      bios: validated.bios ?? null,
      abouts: validated.abouts ?? null,
      industries: validated.industries ?? null,
      netWorthBillions: validated.netWorthBillions ?? null,
      forbesRank: validated.forbesRank ?? null,
      status: validated.status ?? "active",
      crawledAt: validated.crawledAt ? new Date(validated.crawledAt) : null,
    });

    return toPersonDTO(figure);
  }

  async upsertFromCrawler(input: CreatePersonInput): Promise<PersonDTO> {
    const validated = createPersonSchema.parse(input);
    const id = crypto.randomUUID();

    const figure = await this.repo.upsertByWikidataId({
      id,
      name: validated.name,
      lastName: validated.lastName ?? null,
      slug: validated.slug ?? null,
      birthday: validated.birthday,
      gender: validated.gender ?? null,
      categories: validated.categories,
      nationality: validated.nationality ?? null,
      title: validated.title ?? null,
      description: validated.description ?? null,
      imageUrl: validated.imageUrl ?? null,
      thumbnailUrl: validated.thumbnailUrl ?? null,
      wikidataId: validated.wikidataId ?? null,
      wikipediaUrl: validated.wikipediaUrl ?? null,
      tags: validated.tags ?? [],
      popularity: validated.popularity ?? null,
      source: validated.source,
      sourceUrl: validated.sourceUrl ?? null,
      wukuData: validated.wukuData ?? null,
      city: validated.city ?? null,
      state: validated.state ?? null,
      bios: validated.bios ?? null,
      abouts: validated.abouts ?? null,
      industries: validated.industries ?? null,
      netWorthBillions: validated.netWorthBillions ?? null,
      forbesRank: validated.forbesRank ?? null,
      status: validated.status ?? "active",
      crawledAt: validated.crawledAt
        ? new Date(validated.crawledAt)
        : new Date(),
    });

    return toPersonDTO(figure);
  }

  async createBatch(inputs: CreatePersonInput[]): Promise<number> {
    const data = inputs.map((input) => {
      const validated = createPersonSchema.parse(input);
      return {
        id: crypto.randomUUID(),
        name: validated.name,
        lastName: validated.lastName ?? null,
        slug: validated.slug ?? null,
        birthday: validated.birthday,
        gender: validated.gender ?? null,
        categories: validated.categories,
        nationality: validated.nationality ?? null,
        title: validated.title ?? null,
        description: validated.description ?? null,
        imageUrl: validated.imageUrl ?? null,
        thumbnailUrl: validated.thumbnailUrl ?? null,
        wikidataId: validated.wikidataId ?? null,
        wikipediaUrl: validated.wikipediaUrl ?? null,
        tags: validated.tags ?? [],
        popularity: validated.popularity ?? null,
        source: validated.source,
        sourceUrl: validated.sourceUrl ?? null,
        wukuData: validated.wukuData ?? null,
        city: validated.city ?? null,
        state: validated.state ?? null,
        bios: validated.bios ?? null,
        abouts: validated.abouts ?? null,
        industries: validated.industries ?? null,
        netWorthBillions: validated.netWorthBillions ?? null,
        forbesRank: validated.forbesRank ?? null,
        status: validated.status ?? "active",
        crawledAt: validated.crawledAt
          ? new Date(validated.crawledAt)
          : new Date(),
      };
    });

    return this.repo.createBatch(data);
  }

  async getById(id: string): Promise<PersonDTO | null> {
    const figure = await this.repo.findById(id);
    return figure ? toPersonDTO(figure) : null;
  }

  async getBySlug(slug: string): Promise<PersonDTO | null> {
    const figure = await this.repo.findBySlug(slug);
    return figure ? toPersonDTO(figure) : null;
  }

  async getByBirthday(birthday: string): Promise<PersonDTO[]> {
    const figures = await this.repo.findByBirthday(birthday);
    return toPersonDTOList(figures);
  }

  async getTodayBirthdays(): Promise<PersonDTO[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.getByBirthday(today);
  }

  async list(options: FindPersonsOptions = {}): Promise<PersonDTO[]> {
    const figures = await this.repo.findAll({
      ...options,
      limit: Math.min(options.limit ?? PERSON_LIMITS.CRAWLER_BATCH_SIZE, 1000),
    });
    return toPersonDTOList(figures);
  }

  async update(
    id: string,
    input: UpdatePersonInput
  ): Promise<PersonDTO | null> {
    const validated = updatePersonSchema.parse(input);
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.lastName !== undefined)
      updateData.lastName = validated.lastName;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.birthday !== undefined)
      updateData.birthday = validated.birthday;
    if (validated.gender !== undefined) updateData.gender = validated.gender;
    if (validated.categories !== undefined)
      updateData.categories = validated.categories;
    if (validated.nationality !== undefined)
      updateData.nationality = validated.nationality;
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.imageUrl !== undefined)
      updateData.imageUrl = validated.imageUrl;
    if (validated.thumbnailUrl !== undefined)
      updateData.thumbnailUrl = validated.thumbnailUrl;
    if (validated.wikipediaUrl !== undefined)
      updateData.wikipediaUrl = validated.wikipediaUrl;
    if (validated.wukuData !== undefined)
      updateData.wukuData = validated.wukuData;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.popularity !== undefined)
      updateData.popularity = validated.popularity;
    if (validated.tags !== undefined) updateData.tags = validated.tags;
    if (validated.source !== undefined) updateData.source = validated.source;
    if (validated.sourceUrl !== undefined)
      updateData.sourceUrl = validated.sourceUrl;
    if (validated.city !== undefined) updateData.city = validated.city;
    if (validated.state !== undefined) updateData.state = validated.state;
    if (validated.bios !== undefined) updateData.bios = validated.bios;
    if (validated.abouts !== undefined) updateData.abouts = validated.abouts;
    if (validated.industries !== undefined)
      updateData.industries = validated.industries;
    if (validated.netWorthBillions !== undefined)
      updateData.netWorthBillions = validated.netWorthBillions;
    if (validated.forbesRank !== undefined)
      updateData.forbesRank = validated.forbesRank;

    const figure = await this.repo.update(id, updateData);
    return figure ? toPersonDTO(figure) : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async getStats(): Promise<PersonStats> {
    const total = await this.repo.count({ status: "active" });
    const byCategory: Record<string, number> = {};
    for (const category of PERSON_CATEGORIES) {
      byCategory[category] = await this.repo.count({
        status: "active",
        category,
      });
    }

    return { total, byCategory };
  }

  async getExistingWikidataIds(wikidataIds: string[]): Promise<Set<string>> {
    return this.repo.getExistingWikidataIds(wikidataIds);
  }

  async getExistingNames(names: string[]): Promise<Set<string>> {
    return this.repo.getExistingNames(names);
  }

  async findByNames(names: string[]): Promise<PersonDTO[]> {
    const rows = await this.repo.findByNames(names);
    return toPersonDTOList(rows);
  }
}
