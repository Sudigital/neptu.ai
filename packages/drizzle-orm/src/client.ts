import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schemas";

export type Database = NodePgDatabase<typeof schema>;

let db: Database | null = null;
let currentConnectionString: string | undefined;
let currentPool: pg.Pool | null = null;

/**
 * Create a Drizzle database instance from a PostgreSQL connection
 * Uses a singleton pool pattern for connection reuse
 */
export function createDatabase(connectionString?: string): Database {
  const connStr = connectionString ?? process.env.DATABASE_URL;

  // Create new connection if none exists or if connection string changed
  if (!db || (connStr && connStr !== currentConnectionString)) {
    currentPool = new pg.Pool({
      connectionString: connStr,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    db = drizzle(currentPool, { schema });
    currentConnectionString = connStr;
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (currentPool) {
    await currentPool.end();
    currentPool = null;
    db = null;
    currentConnectionString = undefined;
  }
}

export { schema };
