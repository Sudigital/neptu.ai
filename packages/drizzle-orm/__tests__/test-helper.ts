import { Database as BunSQLiteDatabase } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import type { BunSQLiteDatabase as DrizzleBunDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "../src/schemas";

let sqliteDb: BunSQLiteDatabase | null = null;

/**
 * Create an in-memory SQLite database for testing with drizzle-orm.
 * Uses bun:sqlite as the underlying driver.
 */
export function createTestDatabase(): DrizzleBunDatabase<typeof schema> {
  sqliteDb = new BunSQLiteDatabase(":memory:");
  return drizzle(sqliteDb, { schema });
}

/**
 * Close the in-memory test database.
 */
export function closeTestDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}
