import { eq, desc, asc, ilike, or, count, sql } from "drizzle-orm";

import type { Database } from "../client";

import { users, type NewUser, type User } from "../schemas/users";

export interface ListUsersOptions {
  page: number;
  limit: number;
  search?: string;
  sortBy: "createdAt" | "walletAddress" | "displayName";
  sortOrder: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserRepository {
  constructor(private db: Database) {}

  async create(data: NewUser): Promise<User> {
    const now = new Date();
    await this.db.insert(users).values({
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    });
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

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] ?? null;
  }

  async update(
    id: string,
    data: Partial<Omit<NewUser, "id">>
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
    data?: Partial<NewUser>
  ): Promise<User> {
    // 1. If email provided, try to find user by email first
    if (data?.email) {
      const byEmail = await this.findByEmail(data.email);
      if (byEmail) {
        const updates: Partial<Omit<NewUser, "id">> = {};
        // Sync wallet address if it changed
        if (byEmail.walletAddress !== walletAddress) {
          updates.walletAddress = walletAddress;
        }
        if (Object.keys(updates).length > 0) {
          const updated = await this.update(byEmail.id, updates);
          return updated ?? byEmail;
        }
        return byEmail;
      }
    }

    // 2. If no email or not found by email, try wallet address
    const byWallet = await this.findByWalletAddress(walletAddress);
    if (byWallet) {
      const updates: Partial<Omit<NewUser, "id">> = {};
      if (data?.email && data.email !== byWallet.email) {
        updates.email = data.email;
      }
      if (Object.keys(updates).length > 0) {
        const updated = await this.update(byWallet.id, updates);
        return updated ?? byWallet;
      }
      return byWallet;
    }

    // 3. Neither email nor wallet found — create new user
    const id = crypto.randomUUID();
    return this.create({
      id,
      walletAddress,
      ...data,
    });
  }

  async list(options: ListUsersOptions): Promise<PaginatedResult<User>> {
    const { page, limit, search, sortBy, sortOrder } = options;
    const offset = (page - 1) * limit;

    const orderFn = sortOrder === "asc" ? asc : desc;
    let orderColumn;
    if (sortBy === "walletAddress") {
      orderColumn = users.walletAddress;
    } else if (sortBy === "displayName") {
      orderColumn = users.displayName;
    } else {
      orderColumn = users.createdAt;
    }

    let query = this.db.select().from(users).$dynamic();
    let countQuery = this.db.select({ count: count() }).from(users).$dynamic();

    if (search) {
      const searchCondition = or(
        ilike(users.walletAddress, `%${search}%`),
        ilike(users.displayName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      );
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    const [data, totalResult] = await Promise.all([
      query.orderBy(orderFn(orderColumn)).limit(limit).offset(offset),
      countQuery,
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(): Promise<{
    total: number;
    onboarded: number;
    admins: number;
    developers: number;
    todayNew: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.db
      .select({
        total: count(),
        onboarded: sql<number>`COUNT(*) FILTER (WHERE ${users.onboarded} = true)`,
        admins: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'admin')`,
        developers: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'developer')`,
        todayNew: sql<number>`COUNT(*) FILTER (WHERE ${users.createdAt} >= ${today})`,
      })
      .from(users);

    return {
      total: result[0]?.total ?? 0,
      onboarded: Number(result[0]?.onboarded ?? 0),
      admins: Number(result[0]?.admins ?? 0),
      developers: Number(result[0]?.developers ?? 0),
      todayNew: Number(result[0]?.todayNew ?? 0),
    };
  }
}
