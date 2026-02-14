import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schemas";

export type Database = NodePgDatabase<typeof schema>;

let db: Database | null = null;

/**
 * Create a Drizzle database instance from a PostgreSQL connection
 * Uses a singleton pool pattern for connection reuse
 */
export function createDatabase(connectionString?: string): Database {
  if (!db) {
    const pool = new pg.Pool({
      connectionString: connectionString ?? process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export { schema };
