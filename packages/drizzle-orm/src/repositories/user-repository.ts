import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { users, type NewUser, type User } from "../schemas/users";

export class UserRepository {
  constructor(private db: Database) {}

  async create(data: NewUser): Promise<User> {
    await this.db.insert(users).values(data);
    const result = await this.findById(data.id);
    if (!result) {
      throw new Error("Failed to create user");
    }
    return result;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);
    return result[0] ?? null;
  }

  async update(
    id: string,
    data: Partial<Omit<NewUser, "id">>,
  ): Promise<User | null> {
    await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.delete(users).where(eq(users.id, id));
    return true;
  }

  async findOrCreate(
    walletAddress: string,
    data?: Partial<NewUser>,
  ): Promise<User> {
    const existing = await this.findByWalletAddress(walletAddress);
    if (existing) {
      return existing;
    }

    const id = crypto.randomUUID();
    return this.create({
      id,
      walletAddress,
      ...data,
    });
  }
}
