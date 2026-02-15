import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "../src/schemas";

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

function getConnectionConfig(): pg.PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Replace sslmode=require/prefer with sslmode=verify-full to avoid deprecation warning
    const fixedUrl = databaseUrl.replace(
      /sslmode=(require|prefer|verify-ca)/,
      "sslmode=verify-full"
    );
    return {
      connectionString: fixedUrl,
      max: 5,
      idleTimeoutMillis: 30000,
    };
  }

  // Fallback to local docker postgres
  return {
    host: "localhost",
    port: 5432,
    database: "neptu",
    user: "postgres",
    password: "postgres",
    max: 5,
    idleTimeoutMillis: 30000,
    ssl: false,
  };
}

/**
 * Create a PostgreSQL database for testing with drizzle-orm.
 * Uses DATABASE_URL if available, otherwise falls back to local development database.
 */
export function createTestDatabase(): NodePgDatabase<typeof schema> {
  if (!pool) {
    pool = new pg.Pool(getConnectionConfig());
  }

  if (!db) {
    db = drizzle(pool, { schema });
  }

  return db;
}

/**
 * Get the pool for direct database operations.
 */
export function getPool(): pg.Pool | null {
  return pool;
}

/**
 * Close the test database connection pool.
 */
export async function closeTestDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
