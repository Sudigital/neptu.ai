import type { PersonGender, PersonSource, PersonStatus } from "@neptu/shared";

import { eq, and, desc, ilike, sql, inArray, or } from "drizzle-orm";

import type { Database } from "../client";

import { persons, type NewPerson, type Person } from "../schemas/persons";

export interface FindPersonsOptions {
  category?: string;
  status?: PersonStatus;
  source?: PersonSource;
  search?: string;
  industry?: string;
  gender?: PersonGender;
  limit?: number;
  offset?: number;
}

const MONTH_DAY_SLICE_OFFSET = -5;

export class PersonRepository {
  constructor(private db: Database) {}

  async create(data: NewPerson): Promise<Person> {
    const now = new Date();
    await this.db.insert(persons).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
    const result = await this.findById(data.id);
    if (!result) throw new Error("Failed to create person");
    return result;
  }

  async upsertByWikidataId(data: NewPerson): Promise<Person> {
    const now = new Date();
    await this.db
      .insert(persons)
      .values({
        ...data,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      })
      .onConflictDoUpdate({
        target: persons.wikidataId,
        set: {
          name: data.name,
          lastName: data.lastName,
          slug: data.slug,
          birthday: data.birthday,
          gender: data.gender,
          categories: data.categories,
          nationality: data.nationality,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          wikipediaUrl: data.wikipediaUrl,
          tags: data.tags,
          popularity: data.popularity,
          source: data.source,
          sourceUrl: data.sourceUrl,
          wukuData: data.wukuData,
          city: data.city,
          state: data.state,
          bios: data.bios,
          abouts: data.abouts,
          industries: data.industries,
          netWorthBillions: data.netWorthBillions,
          forbesRank: data.forbesRank,
          crawledAt: data.crawledAt,
          updatedAt: now,
        },
      });

    if (data.wikidataId) {
      const result = await this.findByWikidataId(data.wikidataId);
      if (result) return result;
    }
    const result = await this.findById(data.id);
    if (!result) throw new Error("Failed to upsert person");
    return result;
  }

  async createBatch(data: NewPerson[]): Promise<number> {
    if (data.length === 0) return 0;
    const now = new Date();
    const values = data.map((d) => ({
      ...d,
      createdAt: d.createdAt ?? now,
      updatedAt: d.updatedAt ?? now,
    }));

    const result = await this.db
      .insert(persons)
      .values(values)
      .onConflictDoNothing();

    return result.rowCount ?? 0;
  }

  async findById(id: string): Promise<Person | null> {
    const result = await this.db
      .select()
      .from(persons)
      .where(eq(persons.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByWikidataId(wikidataId: string): Promise<Person | null> {
    const result = await this.db
      .select()
      .from(persons)
      .where(eq(persons.wikidataId, wikidataId))
      .limit(1);
    return result[0] ?? null;
  }

  async findBySlug(slug: string): Promise<Person | null> {
    const result = await this.db
      .select()
      .from(persons)
      .where(eq(persons.slug, slug))
      .limit(1);
    return result[0] ?? null;
  }

  async findByBirthday(birthday: string): Promise<Person[]> {
    return this.db
      .select()
      .from(persons)
      .where(
        and(
          sql`substring(${persons.birthday}, 6) = ${birthday.slice(MONTH_DAY_SLICE_OFFSET)}`,
          eq(persons.status, "active")
        )
      )
      .orderBy(desc(persons.createdAt));
  }

  async findAll(options: FindPersonsOptions = {}): Promise<Person[]> {
    const conditions = [];

    if (options.status) {
      conditions.push(eq(persons.status, options.status));
    }
    if (options.source) {
      conditions.push(eq(persons.source, options.source));
    }
    if (options.category) {
      conditions.push(
        sql`${persons.categories}::jsonb @> ${JSON.stringify([options.category])}::jsonb`
      );
    }
    if (options.industry) {
      conditions.push(
        sql`${persons.industries}::jsonb @> ${JSON.stringify([options.industry])}::jsonb`
      );
    }
    if (options.gender) {
      conditions.push(eq(persons.gender, options.gender));
    }
    if (options.search) {
      conditions.push(
        or(
          ilike(persons.name, `%${options.search}%`),
          ilike(persons.lastName, `%${options.search}%`)
        )
      );
    }

    const query = this.db
      .select()
      .from(persons)
      .orderBy(desc(persons.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async findByIds(ids: string[]): Promise<Person[]> {
    if (ids.length === 0) return [];
    return this.db.select().from(persons).where(inArray(persons.id, ids));
  }

  async update(
    id: string,
    data: Partial<Omit<NewPerson, "id">>
  ): Promise<Person | null> {
    await this.db
      .update(persons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(persons.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(persons).where(eq(persons.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async count(options: FindPersonsOptions = {}): Promise<number> {
    const conditions = [];

    if (options.status) {
      conditions.push(eq(persons.status, options.status));
    }
    if (options.category) {
      conditions.push(
        sql`${persons.categories}::jsonb @> ${JSON.stringify([options.category])}::jsonb`
      );
    }

    const query = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(persons);

    if (conditions.length > 0) {
      const result = await query.where(and(...conditions));
      return result[0]?.count ?? 0;
    }
    const result = await query;
    return result[0]?.count ?? 0;
  }

  async getExistingWikidataIds(wikidataIds: string[]): Promise<Set<string>> {
    if (wikidataIds.length === 0) return new Set();
    const result = await this.db
      .select({ wikidataId: persons.wikidataId })
      .from(persons)
      .where(inArray(persons.wikidataId, wikidataIds));
    return new Set(
      result.map((r) => r.wikidataId).filter((id): id is string => id !== null)
    );
  }

  async getExistingNames(names: string[]): Promise<Set<string>> {
    if (names.length === 0) return new Set();
    const result = await this.db
      .select({ name: persons.name })
      .from(persons)
      .where(inArray(persons.name, names));
    return new Set(result.map((r) => r.name));
  }

  async findByNames(names: string[]): Promise<Person[]> {
    if (names.length === 0) return [];
    return this.db.select().from(persons).where(inArray(persons.name, names));
  }
}
