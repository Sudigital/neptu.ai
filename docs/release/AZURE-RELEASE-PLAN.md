# Neptu.ai — Azure Release Plan

> Hybrid deployment: Cloudflare (web + docs) → Azure (API + Worker + Database)

## 1. Architecture Overview

### Current State (Cloudflare)

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE (all services)                │
├─────────────────────────────────────────────────────────────┤
│  CF Pages: @neptu/web (React SPA)                           │
│  CF Pages: @neptu/docs (VitePress)                          │
│  CF Worker: @neptu/api (Hono + D1)                          │
│  CF Worker: @neptu/worker (Hono + D1 + KV + Cron)           │
│  CF D1: SQLite database                                     │
│  CF KV: Key-value cache                                     │
│  External: Azure OpenAI (gpt-4o-mini)                       │
└─────────────────────────────────────────────────────────────┘
```

### Target State (Hybrid)

```
┌─────────────────────────────┐    ┌──────────────────────────────────┐
│     CLOUDFLARE (stays)      │    │          AZURE (new)             │
├─────────────────────────────┤    ├──────────────────────────────────┤
│                             │    │                                  │
│  ┌──────────┐ ┌──────────┐  │    │  ┌──────────────────────────┐   │
│  │ CF Pages │ │ CF Pages │  │    │  │  Azure Container Apps    │   │
│  │ @neptu/  │ │ @neptu/  │  │    │  │                          │   │
│  │  web     │ │  docs    │  │    │  │  ┌────────┐ ┌─────────┐  │   │
│  │ React SPA│ │ VitePress│  │    │  │  │  API   │ │ Worker  │  │   │
│  └────┬─────┘ └──────────┘  │    │  │  │ :3000  │ │  :8080  │  │   │
│       │                     │    │  │  └───┬────┘ └────┬────┘  │   │
│       │ HTTPS               │    │  └──────┼───────────┼───────┘   │
│       └─────────────────────┼────┼─────────┘           │           │
│                             │    │                     │           │
│                             │    │  ┌─────────────┐  ┌─┴─────────┐ │
│                             │    │  │ PostgreSQL  │  │ In-process│ │
│                             │    │  │ Flexible    │  │   Cron    │ │
│                             │    │  │ Server      │  │ (croner)  │ │
│                             │    │  └─────────────┘  └───────────┘ │
│                             │    │                                  │
│                             │    │  ┌─────────┐  ┌─────────────┐   │
│                             │    │  │  Azure  │  │  ACR +      │   │
│                             │    │  │ OpenAI  │  │  Key Vault  │   │
│                             │    │  │(exists) │  │             │   │
│                             │    │  └─────────┘  └─────────────┘   │
└─────────────────────────────┘    └──────────────────────────────────┘
```

### What Stays vs. What Moves

| Service         | Stays on Cloudflare | Moves to Azure | Why                                                    |
| --------------- | :-----------------: | :------------: | ------------------------------------------------------ |
| `@neptu/web`    |         ✅          |       —        | CF Pages is free, global CDN, zero config              |
| `@neptu/docs`   |         ✅          |       —        | Same — already deployed, works well                    |
| `@neptu/api`    |          —          |       ✅       | Decouple from D1/Workers runtime                       |
| `@neptu/worker` |          —          |       ✅       | Decouple from D1/KV, better cron control               |
| Database        |          —          |       ✅       | D1 → PostgreSQL Flexible Server                        |
| Cache (KV)      |          —          |       ✅       | KV → shared Redis (Azure Cache for Redis)              |
| Azure OpenAI    |          —          |       ✅       | Already there (`super-su.cognitiveservices.azure.com`) |
| `@neptu/mobile` |          —          |       —        | Expo — not in scope                                    |
| `@neptu/cli`    |          —          |       —        | Bun binary — not in scope                              |

### Decisions Made

| Decision                   | Choice                     | Rationale                                               |
| -------------------------- | -------------------------- | ------------------------------------------------------- |
| **Database**               | PostgreSQL Flexible Server | Azure-native, managed HA/backups, long-term scalability |
| **Container runtime**      | Bun (`oven/bun:1.2`)       | Native `Bun.serve()`, no adapter needed, faster startup |
| **Cron scheduler**         | BullMQ (Redis-backed)      | Persistent repeatable jobs, retries, survives restarts  |
| **Cache (KV replacement)** | Shared Redis (Basic C0)    | Shared across projects, persistent, survives restarts   |

---

## 2. Database Decision: PostgreSQL

### Why PostgreSQL over libSQL

| Criteria              |         libSQL          |    PostgreSQL (chosen)     |
| --------------------- | :---------------------: | :------------------------: |
| Code changes          |         ~1 file         |         ~15 files          |
| Risk                  |        Very low         | Medium (managed by audit)  |
| Time to migrate       |          Hours          |          2-3 days          |
| Data migration        |  Native SQLite import   |     Transform required     |
| Azure native service  | No (self-host or Turso) | **Yes (Flexible Server)**  |
| Long-term scalability |          Good           |       **Excellent**        |
| Managed HA/backups    |    No (unless Turso)    |     **Yes (built-in)**     |
| Monitoring            |         Manual          | **Azure Monitor built-in** |
| JSON querying         |         Limited         |      **Native JSONB**      |
| Cost                  |  $0 (Turso free) / $15  |       ~$13/mo (B1ms)       |

### Schema Migration Audit — Complete

All schemas use `sqliteTable` from `drizzle-orm/sqlite-core`. Here's every change needed:

#### Global Changes (all 10 schema files)

| Pattern             | SQLite                                              | PostgreSQL                                                       |
| ------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Import source       | `drizzle-orm/sqlite-core`                           | `drizzle-orm/pg-core`                                            |
| Table constructor   | `sqliteTable("name", {...})`                        | `pgTable("name", {...})`                                         |
| Boolean columns     | `integer("col", { mode: "boolean" })`               | `boolean("col")`                                                 |
| Timestamp defaults  | `text("col").default(sql\`(datetime('now'))\`)`     | `timestamp("col", { withTimezone: true }).defaultNow()`          |
| Auto-increment PK   | `integer("id").primaryKey({ autoIncrement: true })` | `serial("id").primaryKey()`                                      |
| Float/money columns | `real("col")`                                       | `numeric("col")` (financial) or `doublePrecision("col")` (stats) |
| JSON text columns   | `text("col")` storing JSON strings                  | `jsonb("col")` (native JSON querying)                            |
| Enum text columns   | `text("col", { enum: [...] })`                      | `text("col")` (use app-level validation or `pgEnum`)             |

#### Per-File Changes

| File                    | `pgTable` | `real`→`numeric`/`double` | `boolean`  | `serial`  | `defaultNow` | `text(enum)` |  `jsonb`   |
| ----------------------- | :-------: | :-----------------------: | :--------: | :-------: | :----------: | :----------: | :--------: |
| `users.ts`              |    ✅     |             —             |   2 cols   |     —     |    2 cols    |      —       |   1 col    |
| `readings.ts`           |    ✅     |             —             |     —      |     —     |    1 col     |    1 col     |   1 col    |
| `payments.ts`           |    ✅     |          3 cols           |     —      |     —     |    1 col     |    2 cols    |     —      |
| `token-transactions.ts` |    ✅     |          5 cols           |     —      |     —     |    1 col     |    3 cols    |     —      |
| `daily-readings.ts`     |    ✅     |             —             |     —      |     —     |    1 col     |    1 col     |   1 col    |
| `user-rewards.ts`       |    ✅     |           1 col           |     —      |     —     |    1 col     |    2 cols    |     —      |
| `user-streaks.ts`       |    ✅     |             —             |     —      |     —     |    2 cols    |      —       |     —      |
| `referrals.ts`          |    ✅     |          2 cols           |     —      |     —     |    1 col     |    2 cols    |     —      |
| `pricing-plans.ts`      |    ✅     |          4 cols           |   2 cols   |     —     |    2 cols    |      —       |   2 cols   |
| `crypto-market.ts`      |  ✅ (×2)  |          15 cols          |     —      |   1 col   |    2 cols    |      —       |     —      |
| **TOTALS**              |  **10**   |        **30 cols**        | **4 cols** | **1 col** | **14 cols**  | **11 cols**  | **5 cols** |

#### Service/Repository SQL Changes

| File                            | Issue                                        | Fix                               |
| ------------------------------- | -------------------------------------------- | --------------------------------- |
| `crypto-market-service.ts` L68  | `sql\`(datetime('now'))\``                   | `sql\`now()\``                    |
| `crypto-market-service.ts` L163 | `datetime(col) < datetime('now', '-7 days')` | `col < now() - interval '7 days'` |
| `user-repository.ts` L39        | `new Date().toISOString()`                   | `new Date()` (timestamp column)   |
| `user-streak-repository.ts`     | `toISOString()` (×3 locations)               | `new Date()` (timestamp column)   |
| `pricing-plan-repository.ts`    | `toISOString()` (×1 location)                | `new Date()` (timestamp column)   |

#### Schema Migration Example

```diff
// packages/drizzle-orm/src/schemas/users.ts
- import { sql } from "drizzle-orm";
- import { text, sqliteTable, index, integer } from "drizzle-orm/sqlite-core";
+ import { text, pgTable, index, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

- export const users = sqliteTable(
+ export const users = pgTable(
    "users",
    {
      id: text("id").primaryKey(),
      walletAddress: text("wallet_address").notNull().unique(),
      email: text("email"),
      displayName: text("display_name"),
      birthDate: text("birth_date"),
-     interests: text("interests"),
+     interests: jsonb("interests"),
-     onboarded: integer("onboarded", { mode: "boolean" }).default(false),
+     onboarded: boolean("onboarded").default(false),
-     isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
+     isAdmin: boolean("is_admin").default(false),
-     createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
+     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
-     updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
+     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("users_wallet_idx").on(table.walletAddress)],
  );
```

#### Client Migration

```diff
// packages/drizzle-orm/src/client.ts
- import { drizzle } from "drizzle-orm/d1";
- import type { DrizzleD1Database } from "drizzle-orm/d1";
+ import { drizzle } from "drizzle-orm/node-postgres";
+ import type { NodePgDatabase } from "drizzle-orm/node-postgres";
+ import pg from "pg";
  import * as schema from "./schemas";

- export type Database = DrizzleD1Database<typeof schema>;
+ export type Database = NodePgDatabase<typeof schema>;

- export function createDatabase(d1: D1Database): Database {
-   return drizzle(d1, { schema });
- }
+ let db: Database | null = null;
+ export function createDatabase(connectionString?: string): Database {
+   if (!db) {
+     const pool = new pg.Pool({
+       connectionString: connectionString ?? process.env.DATABASE_URL,
+       max: 10,
+       idleTimeoutMillis: 30000,
+     });
+     db = drizzle(pool, { schema });
+   }
+   return db;
+ }
```

#### Drizzle Config Migration

```diff
// packages/drizzle-orm/drizzle.config.ts
  export default {
    schema: "./src/schemas/index.ts",
    out: "./drizzle",
-   dialect: "sqlite",
+   dialect: "postgresql",
    dbCredentials: {
-     url: ".wrangler/state/v3/d1/...",
+     url: process.env.DATABASE_URL!,
    },
  } satisfies Config;
```

#### Package.json Changes

```diff
// packages/drizzle-orm/package.json
  "dependencies": {
    "@neptu/shared": "workspace:*",
    "drizzle-orm": "^0.44.2",
+   "pg": "^8.13.0",
    "zod": "^3.25.56"
  },
  "devDependencies": {
-   "@cloudflare/workers-types": "^4.20250214.0",
+   "@types/pg": "^8.11.0",
    ...
  }
```

---

## 3. KV Cache Replacement: Shared Redis (Azure Cache for Redis)

### Current KV Usage Scope

The Cloudflare KV (`KVNamespace`) is used **extensively** across the worker:

| Area            | Files                                                               | KV Refs |
| --------------- | ------------------------------------------------------------------- | :-----: |
| **Main worker** | `index.ts`                                                          |    3    |
| **Routes**      | `oracle.ts`, `colosseum.ts`, `crypto.ts`, `colosseum-project.ts`    |   15+   |
| **Colosseum**   | `heartbeat.ts`, `heartbeat-helpers.ts`, `orchestrator.ts`           |   10+   |
| **Colosseum**   | `analytics.ts`, `engagement-booster.ts`, `voting-strategy.ts`       |   10+   |
| **Colosseum**   | `post-creator.ts`, `crypto-posts.ts`, `crypto-posts-market.ts`      |   8+    |
| **Colosseum**   | `trending-analyzer.ts`, `trend-detector.ts`, `project-spotlight.ts` |   6+    |
| **Colosseum**   | `agent-cosmic-profile.ts`, `final-day-forecast.ts`                  |   6+    |
| **AI**          | `ai/oracle.ts`                                                      |    4    |
| **TOTAL**       |                                                                     | **60+** |

### Migration Strategy: Create a `CacheStore` Interface

Instead of replacing 60+ `KVNamespace` references with a concrete Redis client, create a minimal `CacheStore` interface that mirrors the KV API. This makes the cache backend swappable (Redis in prod, in-memory Map in tests):

```typescript
// apps/worker/src/cache.ts
import IORedis from "ioredis";

export interface CacheStore {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Create a new IORedis connection.
 * BullMQ requires `maxRetriesPerRequest: null`.
 * Each Queue / Worker needs its own connection instance.
 */
export function createRedisConnection(): IORedis {
  const conn = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  conn.on("error", (err) => console.error("[Redis]", err));
  return conn;
}

const cacheConn = createRedisConnection();

export const redisCache: CacheStore = {
  async get(key: string): Promise<string | null> {
    return cacheConn.get(key);
  },

  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void> {
    const ttl = options?.expirationTtl ?? 3600;
    await cacheConn.set(key, value, "EX", ttl);
  },

  async delete(key: string): Promise<void> {
    await cacheConn.del(key);
  },
};
```

Then replace `KVNamespace` type references with `CacheStore` across all colosseum/AI files. Since `CacheStore` exposes the same `get`/`put`/`delete` API as `KVNamespace`, the calling code barely changes.

> **Shared Redis:** This Azure Cache for Redis instance (`sudigital-redis`) is shared across multiple SUDIGITAL projects. Neptu keys are prefixed naturally by context (e.g. `daily:2026-02-13`, `colosseum:heartbeat:*`), so no key collisions occur.

```diff
// Example: apps/worker/src/colosseum/heartbeat.ts
- CACHE: KVNamespace;
+ CACHE: CacheStore;
```

### Worker KV Migration Files (20+ files)

| File                                     | `KVNamespace` refs | Change                                     |
| ---------------------------------------- | :----------------: | ------------------------------------------ |
| `src/cache.ts`                           |         —          | **New file** — `CacheStore` + `redisCache` |
| `src/index.ts`                           |         3          | Import `redisCache`, pass to routes        |
| `src/routes/oracle.ts`                   |         6          | Type → `CacheStore`                        |
| `src/routes/colosseum.ts`                |         3          | Type → `CacheStore`                        |
| `src/routes/crypto.ts`                   |         1          | Type → `CacheStore`                        |
| `src/routes/colosseum-project.ts`        |         1          | Type → `CacheStore`                        |
| `src/colosseum/heartbeat.ts`             |         2          | Config type → `CacheStore`                 |
| `src/colosseum/heartbeat-helpers.ts`     |         5          | Params → `CacheStore`                      |
| `src/colosseum/orchestrator.ts`          |         7          | Params/types → `CacheStore`                |
| `src/colosseum/analytics.ts`             |         6          | Params → `CacheStore`                      |
| `src/colosseum/engagement-booster.ts`    |         4          | Params → `CacheStore`                      |
| `src/colosseum/voting-strategy.ts`       |         2          | Params → `CacheStore`                      |
| `src/colosseum/post-creator.ts`          |         3          | Params → `CacheStore`                      |
| `src/colosseum/crypto-posts.ts`          |         3          | Params → `CacheStore`                      |
| `src/colosseum/crypto-posts-market.ts`   |         2          | Params → `CacheStore`                      |
| `src/colosseum/trending-analyzer.ts`     |         2          | Params → `CacheStore`                      |
| `src/colosseum/trend-detector.ts`        |         2          | Params → `CacheStore`                      |
| `src/colosseum/project-spotlight.ts`     |         1          | Params → `CacheStore`                      |
| `src/colosseum/agent-cosmic-profile.ts`  |         3          | Params → `CacheStore`                      |
| `src/colosseum/final-day-forecast.ts`    |         2          | Params → `CacheStore`                      |
| `src/colosseum/crypto-market-fetcher.ts` |      0 + 2 D1      | `D1Database` → `Database` from drizzle-orm |
| `src/ai/oracle.ts`                       |         4          | Params → `CacheStore`                      |

---

## 4. Cron Scheduler: BullMQ (Redis-backed)

### Why BullMQ over In-Process Cron or Container Apps Jobs

| Factor        | BullMQ (Redis)             | `croner` (in-process) | Container Apps Jobs   |
| ------------- | -------------------------- | --------------------- | --------------------- |
| Persistence   | **Jobs survive restarts**  | Lost on restart       | Independent execution |
| Retries       | **Built-in with backoff**  | Manual                | Manual                |
| Deduplication | **Redis-backed locks**     | None                  | N/A                   |
| Cold start    | None — runs in worker      | None                  | ~5-15s per execution  |
| Cost          | **$0** — uses shared Redis | $0                    | ~$5/mo consumption    |
| Monitoring    | BullMQ dashboard / logs    | Console logs          | Azure Monitor         |
| Scalability   | Multi-worker safe          | Single instance only  | Independent execution |

### Implementation

```typescript
// apps/worker/src/cron.ts
import { Queue, Worker } from "bullmq";
import { createRedisConnection } from "./cache";

interface CronDeps {
  runHeartbeat: (phase: string) => Promise<void>;
  generateDailyReadings: () => Promise<void>;
  refreshCryptoMarketData: () => Promise<void>;
}

const QUEUE_NAME = "neptu-cron";

export async function startCronJobs(deps: CronDeps): Promise<void> {
  const queueConn = createRedisConnection();
  const workerConn = createRedisConnection();
  const queue = new Queue(QUEUE_NAME, { connection: queueConn });

  // Remove stale repeatable jobs to avoid duplicates on restart
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Every 3 min: Reply to comments
  await queue.add(
    "reply_comments",
    {},
    {
      repeat: { pattern: "*/3 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Every 5 min: Comment on others + vote
  await queue.add(
    "comment_and_vote",
    {},
    {
      repeat: { pattern: "*/5 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Every 10 min: Post new thread + other activity + market refresh
  await queue.add(
    "post_and_refresh",
    {},
    {
      repeat: { pattern: "*/10 * * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Daily midnight: Generate readings + refresh market data
  await queue.add(
    "daily_tasks",
    {},
    {
      repeat: { pattern: "0 0 * * *" },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Process jobs (single concurrency to avoid duplicate heartbeat runs)
  new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`[BullMQ] Processing ${job.name}`);
      switch (job.name) {
        case "reply_comments":
          await deps.runHeartbeat("reply_comments");
          break;
        case "comment_and_vote":
          await deps.runHeartbeat("comment_others");
          if (new Date().getMinutes() % 15 === 0)
            await deps.runHeartbeat("vote");
          break;
        case "post_and_refresh": {
          const min = new Date().getMinutes();
          await deps.runHeartbeat("post_thread");
          if (min % 20 === 0) await deps.runHeartbeat("other_activity");
          if (min === 0) await deps.refreshCryptoMarketData();
          break;
        }
        case "daily_tasks":
          await deps.generateDailyReadings();
          await deps.refreshCryptoMarketData();
          break;
      }
    },
    { connection: workerConn, concurrency: 1 }
  );

  console.log("[BullMQ] Cron jobs registered (4 repeatable schedules)");
}
```

---

## 5. Migration Plan

### Phase 1: Azure Foundation (Day 1)

#### 1.1 Provision Resources

> **Note:** Most resources already exist in the shared `sudigital-rg` resource group.
> Existing: `sudigital-rg`, `sudigitalacr`, `sudigital-env`, `sudigital-kv`, `sudigital-db`, `sudigital-redis`.
> We only need to create the `neptu` database and ensure the firewall rule is set.

```bash
# Resource Group         — SKIP (already exists: sudigital-rg)
# Container Apps Env     — SKIP (already exists: sudigital-env)
# Container Registry     — SKIP (already exists: sudigitalacr)
# Key Vault              — SKIP (already exists: sudigital-kv)
# PostgreSQL Server      — SKIP (already exists: sudigital-db)
# Redis                  — SKIP (already exists: sudigital-redis)

# Create the neptu databases on the existing PostgreSQL server
az postgres flexible-server db create \
  --resource-group sudigital-rg \
  --server-name sudigital-db \
  --database-name neptu

az postgres flexible-server db create \
  --resource-group sudigital-rg \
  --server-name sudigital-db \
  --database-name neptu_dev

# Allow Container Apps Environment to access PostgreSQL (if not already set)
az postgres flexible-server firewall-rule create \
  --resource-group sudigital-rg \
  --name sudigital-db \
  --rule-name allow-azure-services \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create dev Container Apps Environment (production uses sudigital-env)
az containerapp env create \
  --name sudigital-env-dev \
  --resource-group sudigital-rg \
  --logs-workspace-id <LOGS_WORKSPACE_ID> \
  --location southeastasia
```

#### 1.2 Store Secrets in Key Vault

```bash
# Production secrets
az keyvault secret set --vault-name sudigital-kv --name "NEPTU-DATABASE-URL" \
  --value "postgresql://neptuadmin:<PASSWORD>@sudigital-db.postgres.database.azure.com:5432/neptu?sslmode=require"

# Dev secrets
az keyvault secret set --vault-name sudigital-kv --name "NEPTU-DEV-DATABASE-URL" \
  --value "postgresql://neptuadmin:<PASSWORD>@sudigital-db.postgres.database.azure.com:5432/neptu_dev?sslmode=require"
az keyvault secret set --vault-name sudigital-kv --name "AZURE-OPENAI-API-KEY" --value "<value>"
az keyvault secret set --vault-name sudigital-kv --name "COLOSSEUM-API-KEY" --value "<value>"
az keyvault secret set --vault-name sudigital-kv --name "COINGECKO-API-KEY" --value "<value>"
az keyvault secret set --vault-name sudigital-kv --name "PRIVY-APP-SECRET" --value "<value>"
az keyvault secret set --vault-name sudigital-kv --name "ADMIN-WALLET-ADDRESS" --value "<value>"
az keyvault secret set --vault-name sudigital-kv --name "REDIS-URL" \
  --value "rediss://:$(az redis list-keys --name sudigital-redis --resource-group sudigital-rg --query primaryKey -o tsv)@sudigital-redis.redis.cache.windows.net:6380"
```

---

### Phase 2: Code Refactoring (Day 1-3)

#### 2.1 Database Layer — `@neptu/drizzle-orm`

| File                                          | Change                                                     | Effort |
| --------------------------------------------- | ---------------------------------------------------------- | ------ |
| `src/client.ts`                               | D1 driver → `node-postgres` with `pg.Pool`                 | Small  |
| `drizzle.config.ts`                           | `dialect: "sqlite"` → `"postgresql"`, update credentials   | Small  |
| `package.json`                                | Add `pg` + `@types/pg`, remove `@cloudflare/workers-types` | Small  |
| `src/schemas/users.ts`                        | `sqliteTable` → `pgTable`, boolean, timestamp, jsonb       | Medium |
| `src/schemas/readings.ts`                     | `sqliteTable` → `pgTable`, timestamp, jsonb                | Small  |
| `src/schemas/payments.ts`                     | `sqliteTable` → `pgTable`, numeric, timestamp              | Medium |
| `src/schemas/token-transactions.ts`           | `sqliteTable` → `pgTable`, numeric, timestamp              | Medium |
| `src/schemas/daily-readings.ts`               | `sqliteTable` → `pgTable`, timestamp, jsonb                | Small  |
| `src/schemas/user-rewards.ts`                 | `sqliteTable` → `pgTable`, numeric, timestamp              | Small  |
| `src/schemas/user-streaks.ts`                 | `sqliteTable` → `pgTable`, timestamp                       | Small  |
| `src/schemas/referrals.ts`                    | `sqliteTable` → `pgTable`, numeric, timestamp              | Small  |
| `src/schemas/pricing-plans.ts`                | `sqliteTable` → `pgTable`, numeric, boolean, jsonb         | Medium |
| `src/schemas/crypto-market.ts`                | `sqliteTable` → `pgTable`, doublePrecision, serial         | Medium |
| `src/services/crypto-market-service.ts`       | Fix 2 raw SQL queries (`datetime()` → `now()`)             | Small  |
| `src/repositories/user-repository.ts`         | `toISOString()` → `new Date()`                             | Tiny   |
| `src/repositories/user-streak-repository.ts`  | `toISOString()` → `new Date()` (×3)                        | Tiny   |
| `src/repositories/pricing-plan-repository.ts` | `toISOString()` → `new Date()`                             | Tiny   |

#### 2.2 Cache Layer — `@neptu/worker`

| File                  | Change                                          | Effort |
| --------------------- | ----------------------------------------------- | ------ |
| `src/cache.ts`        | **New** — `CacheStore` interface + `redisCache` | Small  |
| 20 colosseum/AI files | `KVNamespace` type → `CacheStore` import        | Medium |
| `src/index.ts`        | Import `redisCache`, pass to routes             | Small  |

#### 2.3 API — `@neptu/api`

Remove Cloudflare Worker runtime, run as Bun server:

```diff
// apps/api/src/index.ts

- interface Env {
-   DB: D1Database;
-   ENVIRONMENT: string;
-   ADMIN_WALLET_ADDRESS?: string;
-   SOLANA_RPC_URL?: string;
-   SOLANA_NETWORK?: string;
- }
-
- type Variables = {
-   db: ReturnType<typeof createDatabase>;
-   adminWalletAddress: string | undefined;
- };
-
- const app = new Hono<{ Bindings: Env; Variables: Variables }>();

+ type Variables = {
+   db: ReturnType<typeof createDatabase>;
+   adminWalletAddress: string | undefined;
+ };
+
+ const app = new Hono<{ Variables: Variables }>();

  // ... CORS middleware stays the same ...

- app.use("*", async (c, next) => {
-   const db = createDatabase(c.env.DB);
-   c.set("db", db);
-   c.set("adminWalletAddress", c.env.ADMIN_WALLET_ADDRESS);
-   await next();
- });

+ const db = createDatabase(); // reads DATABASE_URL from process.env
+ app.use("*", async (c, next) => {
+   c.set("db", db);
+   c.set("adminWalletAddress", process.env.ADMIN_WALLET_ADDRESS);
+   await next();
+ });

  // ... routes stay the same ...

- export default app;

+ const port = Number(process.env.PORT || 3000);
+ console.log(`Neptu API running on port ${port}`);
+ Bun.serve({ fetch: app.fetch, port });
```

**Package.json changes:**

```diff
// apps/api/package.json
  "scripts": {
-   "dev": "wrangler dev --port 3000 --remote",
+   "dev": "bun run --hot src/index.ts",
-   "deploy": "wrangler deploy --env production",
+   "deploy": "echo 'Deployed via Azure Container Apps CI/CD'",
  }
```

#### 2.4 Worker — `@neptu/worker`

Same pattern: remove CF bindings, use `redisCache`, BullMQ cron, run as Bun server:

```diff
// apps/worker/src/index.ts

- interface Env {
-   DB: D1Database;
-   CACHE: KVNamespace;
-   AZURE_OPENAI_API_KEY: string;
-   // ... all env vars from bindings
- }
-
- const app = new Hono<{ Bindings: Env }>();

+ import { redisCache } from "./cache";
+ import { startCronJobs } from "./cron";
+
+ const app = new Hono();

  const db = createDatabase(); // reads DATABASE_URL from process.env

  // Daily reading route — replace KV calls:
- const cached = await c.env.CACHE.get(`daily:${date}`);
+ const cached = await redisCache.get(`daily:${date}`);

- await c.env.CACHE.put(`daily:${date}`, JSON.stringify(reading), {
-   expirationTtl: 86400,
- });
+ await redisCache.put(`daily:${date}`, JSON.stringify(reading), {
+   expirationTtl: 86400,
+ });

  // Read config from process.env instead of c.env
- const heartbeat = new HeartbeatScheduler({
-   COLOSSEUM_API_KEY: env.COLOSSEUM_API_KEY,
-   CACHE: env.CACHE,
-   DB: env.DB,
- });
+ const heartbeat = new HeartbeatScheduler({
+   COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
+   CACHE: redisCache,
+ });

  // Replace CF scheduled() export with BullMQ cron jobs
- export default {
-   fetch: app.fetch,
-   async scheduled(event, env, ctx): Promise<void> {
-     // ... cron matching logic ...
-   },
- };

+ await startCronJobs({
+   runHeartbeat: (phase) => runColosseumHeartbeat(phase),
+   generateDailyReadings: () => generateDailyReadings(),
+   refreshCryptoMarketData: () => refreshCryptoMarketData(),
+ });
+
+ const port = Number(process.env.PORT || 8080);
+ console.log(`Neptu Worker running on port ${port}`);
+ Bun.serve({ fetch: app.fetch, port });
```

#### 2.5 Route Files — Remove Env Bindings

All worker route files define local `Env` interfaces with `DB: D1Database` and `CACHE: KVNamespace`. These need to use module-level `db` and `redisCache` imports instead of `c.env.*`.

#### 2.6 Colosseum Module — D1Database References

Two colosseum files use `D1Database` directly (not through `createDatabase`):

| File                       | Current                     | Fix                               |
| -------------------------- | --------------------------- | --------------------------------- |
| `crypto-market-fetcher.ts` | `(db: D1Database)` param    | `(db: Database)` from drizzle-orm |
| `heartbeat.ts`             | `DB?: D1Database` in config | `db?: Database` from drizzle-orm  |
| `orchestrator.ts`          | `db?: D1Database` in config | `db?: Database` from drizzle-orm  |

#### 2.7 Update CORS Origins

```diff
// packages/shared/src/index.ts
  export const CORS_ALLOWED_ORIGINS = [
    "https://neptu.sudigital.com",
    "https://neptu-web-production.pages.dev",
    "http://localhost:3001",
+   "http://localhost:3000",
  ] as const;
```

---

### Phase 3: Containerization (Day 3-4)

#### 3.1 Dockerfile for API

```dockerfile
# apps/api/Dockerfile
FROM oven/bun:1.2 AS deps
WORKDIR /app

COPY package.json bun.lock* bunfig.toml ./
COPY apps/api/package.json apps/api/
COPY packages/drizzle-orm/package.json packages/drizzle-orm/
COPY packages/shared/package.json packages/shared/
COPY packages/wariga/package.json packages/wariga/
COPY packages/solana/package.json packages/solana/

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.2-slim AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/ apps/api/
COPY packages/ packages/
COPY package.json bunfig.toml ./

EXPOSE 3000
ENV PORT=3000
CMD ["bun", "run", "apps/api/src/index.ts"]
```

#### 3.2 Dockerfile for Worker

```dockerfile
# apps/worker/Dockerfile
FROM oven/bun:1.2 AS deps
WORKDIR /app

COPY package.json bun.lock* bunfig.toml ./
COPY apps/worker/package.json apps/worker/
COPY packages/drizzle-orm/package.json packages/drizzle-orm/
COPY packages/shared/package.json packages/shared/
COPY packages/wariga/package.json packages/wariga/

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.2-slim AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/worker/ apps/worker/
COPY packages/ packages/
COPY package.json bunfig.toml ./

EXPOSE 8080
ENV PORT=8080
CMD ["bun", "run", "apps/worker/src/index.ts"]
```

#### 3.3 docker-compose.azure.yml (Local Testing)

```yaml
# docker-compose.azure.yml — simulates the Azure deployment locally
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - 5432:5432
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: neptuadmin
      POSTGRES_PASSWORD: neptupass
      POSTGRES_DB: neptu

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - 3000:3000
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://neptuadmin:neptupass@postgres:5432/neptu
      ENVIRONMENT: development
      PORT: 3000
      ADMIN_WALLET_ADDRESS: ${ADMIN_WALLET_ADDRESS}
      SOLANA_RPC_URL: https://api.devnet.solana.com
      SOLANA_NETWORK: devnet

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    ports:
      - 8080:8080
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://neptuadmin:neptupass@postgres:5432/neptu
      AZURE_OPENAI_API_KEY: ${AZURE_OPENAI_API_KEY}
      AZURE_OPENAI_ENDPOINT: https://super-su.cognitiveservices.azure.com/
      AZURE_OPENAI_DEPLOYMENT: gpt-4o-mini
      AZURE_OPENAI_API_VERSION: 2024-04-01-preview
      COLOSSEUM_API_KEY: ${COLOSSEUM_API_KEY}
      COLOSSEUM_AGENT_ID: "206"
      COLOSSEUM_AGENT_NAME: Neptu
      COINGECKO_API_KEY: ${COINGECKO_API_KEY}
      REDIS_URL: redis://redis:6379
      ENVIRONMENT: development
      PORT: 8080

  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379
    volumes:
      - redis_data:/data

volumes:
  pg_data:
  redis_data:
```

---

### Phase 4: Azure Deployment (Day 4-5)

#### 4.1 Build & Push Images

```bash
az acr login --name sudigitalacr

docker build -f apps/api/Dockerfile -t sudigitalacr.azurecr.io/neptu-api:latest .
docker build -f apps/worker/Dockerfile -t sudigitalacr.azurecr.io/neptu-worker:latest .

docker push sudigitalacr.azurecr.io/neptu-api:latest
docker push sudigitalacr.azurecr.io/neptu-worker:latest
```

#### 4.2 Deploy Production

```bash
# Production API
az containerapp create \
  --name neptu-api \
  --resource-group sudigital-rg \
  --environment sudigital-env \
  --image sudigitalacr.azurecr.io/neptu-api:latest \
  --registry-server sudigitalacr.azurecr.io \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --secrets \
    db-url=<PRODUCTION_DATABASE_URL> \
    privy-secret=<PRIVY_APP_SECRET> \
    admin-wallet=<ADMIN_WALLET_ADDRESS> \
    solana-rpc=<SOLANA_RPC_URL> \
  --env-vars \
    DATABASE_URL=secretref:db-url \
    PRIVY_APP_SECRET=secretref:privy-secret \
    ADMIN_WALLET_ADDRESS=secretref:admin-wallet \
    SOLANA_RPC_URL=secretref:solana-rpc \
    SOLANA_NETWORK=devnet \
    ENVIRONMENT=production \
    PORT=3000

# Production Worker
az containerapp create \
  --name neptu-worker \
  --resource-group sudigital-rg \
  --environment sudigital-env \
  --image sudigitalacr.azurecr.io/neptu-worker:latest \
  --registry-server sudigitalacr.azurecr.io \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.5 \
  --memory 1Gi \
  --secrets \
    db-url=<PRODUCTION_DATABASE_URL> \
    redis-url=<REDIS_URL> \
    azure-openai-key=<KEY> \
    colosseum-key=<KEY> \
    coingecko-key=<KEY> \
  --env-vars \
    DATABASE_URL=secretref:db-url \
    REDIS_URL=secretref:redis-url \
    AZURE_OPENAI_API_KEY=secretref:azure-openai-key \
    AZURE_OPENAI_ENDPOINT=https://super-su.cognitiveservices.azure.com/ \
    AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini \
    AZURE_OPENAI_API_VERSION=2024-04-01-preview \
    COLOSSEUM_API_KEY=secretref:colosseum-key \
    COLOSSEUM_AGENT_ID=206 \
    COLOSSEUM_AGENT_NAME=Neptu \
    COINGECKO_API_KEY=secretref:coingecko-key \
    ENVIRONMENT=production \
    PORT=8080
```

> **Note:** Worker `max-replicas: 1` — in-process cron should only run on one instance to avoid duplicate jobs.

#### 4.3 Deploy Dev

```bash
# Dev API
az containerapp create \
  --name neptu-api-dev \
  --resource-group sudigital-rg \
  --environment sudigital-env-dev \
  --image sudigitalacr.azurecr.io/neptu-api:dev \
  --registry-server sudigitalacr.azurecr.io \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 1 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --secrets \
    db-url=<DEV_DATABASE_URL> \
    privy-secret=<PRIVY_APP_SECRET> \
    admin-wallet=<ADMIN_WALLET_ADDRESS> \
    solana-rpc=<SOLANA_RPC_URL> \
  --env-vars \
    DATABASE_URL=secretref:db-url \
    PRIVY_APP_SECRET=secretref:privy-secret \
    ADMIN_WALLET_ADDRESS=secretref:admin-wallet \
    SOLANA_RPC_URL=secretref:solana-rpc \
    SOLANA_NETWORK=devnet \
    ENVIRONMENT=development \
    PORT=3000

# Dev Worker
az containerapp create \
  --name neptu-worker-dev \
  --resource-group sudigital-rg \
  --environment sudigital-env-dev \
  --image sudigitalacr.azurecr.io/neptu-worker:dev \
  --registry-server sudigitalacr.azurecr.io \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 1 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --secrets \
    db-url=<DEV_DATABASE_URL> \
    redis-url=<REDIS_URL> \
    azure-openai-key=<KEY> \
    colosseum-key=<KEY> \
    coingecko-key=<KEY> \
  --env-vars \
    DATABASE_URL=secretref:db-url \
    REDIS_URL=secretref:redis-url \
    AZURE_OPENAI_API_KEY=secretref:azure-openai-key \
    AZURE_OPENAI_ENDPOINT=https://super-su.cognitiveservices.azure.com/ \
    AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini \
    AZURE_OPENAI_API_VERSION=2024-04-01-preview \
    COLOSSEUM_API_KEY=secretref:colosseum-key \
    COLOSSEUM_AGENT_ID=206 \
    COLOSSEUM_AGENT_NAME=Neptu \
    COINGECKO_API_KEY=secretref:coingecko-key \
    ENVIRONMENT=development \
    PORT=8080
```

> **Note:** Dev uses `min-replicas: 0` (scale to zero) and smaller resources to minimize cost.

---

### Phase 5: CI/CD with GitHub Actions (Day 5-6)

#### 5.1 GitHub Secrets & Environments

Create two GitHub environments: **development** and **production**.

**Repository-level secrets** (shared):

| Secret                 | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| `AZURE_CREDENTIALS`    | Service principal JSON (from `az ad sp create-for-rbac`) |
| `ACR_LOGIN_SERVER`     | `sudigitalacr.azurecr.io`                                |
| `ACR_USERNAME`         | ACR admin username                                       |
| `ACR_PASSWORD`         | ACR admin password                                       |
| `AZURE_RESOURCE_GROUP` | `sudigital-rg`                                           |

**Development environment** secrets:

| Secret         | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | `postgresql://...@sudigital-db.../neptu_dev?sslmode=require` |
| `REDIS_URL`    | Redis connection string                                      |

**Production environment** secrets:

| Secret         | Value                                                    |
| -------------- | -------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://...@sudigital-db.../neptu?sslmode=require` |
| `REDIS_URL`    | Redis connection string                                  |

#### 5.2 Deploy Workflow

Branch-based deployment: `feature` → `dev` (deploys to dev env) → `main` (deploys to production).

```yaml
# .github/workflows/deploy-azure.yml
name: Deploy to Azure

on:
  push:
    branches: [main, dev]
    paths:
      - "apps/api/**"
      - "apps/worker/**"
      - "packages/**"
      - "docker-compose.yml"

env:
  REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }}
  API_IMAGE: neptu-api
  WORKER_IMAGE: neptu-worker

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'main' && 'production' || 'development' }}
    env:
      SUFFIX: ${{ github.ref_name == 'main' && '' || '-dev' }}
      TAG_ENV: ${{ github.ref_name == 'main' && 'latest' || 'dev' }}
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Azure Container Registry
        uses: azure/docker-login@v2
        with:
          login-server: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push API image
        run: |
          docker build -f apps/api/Dockerfile \
            -t $REGISTRY/$API_IMAGE:${{ github.sha }} \
            -t $REGISTRY/$API_IMAGE:$TAG_ENV .
          docker push $REGISTRY/$API_IMAGE:${{ github.sha }}
          docker push $REGISTRY/$API_IMAGE:$TAG_ENV

      - name: Build and push Worker image
        run: |
          docker build -f apps/worker/Dockerfile \
            -t $REGISTRY/$WORKER_IMAGE:${{ github.sha }} \
            -t $REGISTRY/$WORKER_IMAGE:$TAG_ENV .
          docker push $REGISTRY/$WORKER_IMAGE:${{ github.sha }}
          docker push $REGISTRY/$WORKER_IMAGE:$TAG_ENV

      - name: Log in to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy API to Container Apps
        uses: azure/container-apps-deploy-action@v2
        with:
          containerAppName: neptu-api${{ env.SUFFIX }}
          resourceGroup: ${{ secrets.AZURE_RESOURCE_GROUP }}
          imageToDeploy: ${{ env.REGISTRY }}/${{ env.API_IMAGE }}:${{ github.sha }}

      - name: Deploy Worker to Container Apps
        uses: azure/container-apps-deploy-action@v2
        with:
          containerAppName: neptu-worker${{ env.SUFFIX }}
          resourceGroup: ${{ secrets.AZURE_RESOURCE_GROUP }}
          imageToDeploy: ${{ env.REGISTRY }}/${{ env.WORKER_IMAGE }}:${{ github.sha }}
```

#### 5.3 PR Quality Gate

```yaml
# .github/workflows/pr-check.yml
name: PR Quality Gate

on:
  pull_request:
    branches: [main, dev]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: "1.2" }
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run lint
      - run: bun run test
```

Web and docs continue deploying via Cloudflare Pages (no changes needed).

---

### Phase 6: Custom Domains & DNS (Day 6)

> **DNS Provider:** Cloudflare (managing `sudigital.com`)
> **Important:** All CNAME records must use **DNS only (grey cloud)** — Cloudflare proxy breaks Azure domain verification and managed TLS.

#### 6.1 Domain Overview

| Domain                           | Service                           | Status             |
| -------------------------------- | --------------------------------- | ------------------ |
| `neptu.sudigital.com`            | CF Pages (web) — **no change**    | Already configured |
| `docs.neptu.sudigital.com`       | CF Pages (docs) — **no change**   | Already configured |
| `api.neptu.sudigital.com`        | Azure Container Apps (production) | New                |
| `worker.neptu.sudigital.com`     | Azure Container Apps (production) | New                |
| `dev.api.neptu.sudigital.com`    | Azure Container Apps (dev)        | New                |
| `dev.worker.neptu.sudigital.com` | Azure Container Apps (dev)        | New                |

#### 6.2 Cloudflare DNS Records — TXT (domain verification)

Azure domain verification ID: `5ED978E18FB9B0A096F08C1B7950E3C0FB678641C70E935BA702220870E4133E`

| Type | Name                     | Content (verification ID above)                                    | Proxy |
| ---- | ------------------------ | ------------------------------------------------------------------ | ----- |
| TXT  | `asuid.api.neptu`        | `5ED978E18FB9B0A096F08C1B7950E3C0FB678641C70E935BA702220870E4133E` | —     |
| TXT  | `asuid.worker.neptu`     | `5ED978E18FB9B0A096F08C1B7950E3C0FB678641C70E935BA702220870E4133E` | —     |
| TXT  | `asuid.dev.api.neptu`    | `5ED978E18FB9B0A096F08C1B7950E3C0FB678641C70E935BA702220870E4133E` | —     |
| TXT  | `asuid.dev.worker.neptu` | `5ED978E18FB9B0A096F08C1B7950E3C0FB678641C70E935BA702220870E4133E` | —     |

#### 6.3 Cloudflare DNS Records — CNAME (routing)

| Type  | Name               | Target                                                                      | Proxy    |
| ----- | ------------------ | --------------------------------------------------------------------------- | -------- |
| CNAME | `api.neptu`        | `neptu-api.wonderfulpond-ec80feb1.southeastasia.azurecontainerapps.io`      | DNS only |
| CNAME | `worker.neptu`     | `neptu-worker.wonderfulpond-ec80feb1.southeastasia.azurecontainerapps.io`   | DNS only |
| CNAME | `dev.api.neptu`    | `neptu-api-dev.bravemeadow-52aa0292.southeastasia.azurecontainerapps.io`    | DNS only |
| CNAME | `dev.worker.neptu` | `neptu-worker-dev.bravemeadow-52aa0292.southeastasia.azurecontainerapps.io` | DNS only |

#### 6.4 Azure — Add custom domains + managed TLS

After DNS records are added, run:

```bash
# --- Production API ---
az containerapp hostname add \
  --name neptu-api --resource-group sudigital-rg \
  --hostname api.neptu.sudigital.com

az containerapp hostname bind \
  --name neptu-api --resource-group sudigital-rg \
  --hostname api.neptu.sudigital.com \
  --environment sudigital-env --validation-method CNAME

# --- Production Worker ---
az containerapp hostname add \
  --name neptu-worker --resource-group sudigital-rg \
  --hostname worker.neptu.sudigital.com

az containerapp hostname bind \
  --name neptu-worker --resource-group sudigital-rg \
  --hostname worker.neptu.sudigital.com \
  --environment sudigital-env --validation-method CNAME

# --- Dev API ---
az containerapp hostname add \
  --name neptu-api-dev --resource-group sudigital-rg \
  --hostname dev.api.neptu.sudigital.com

az containerapp hostname bind \
  --name neptu-api-dev --resource-group sudigital-rg \
  --hostname dev.api.neptu.sudigital.com \
  --environment sudigital-env-dev --validation-method CNAME

# --- Dev Worker ---
az containerapp hostname add \
  --name neptu-worker-dev --resource-group sudigital-rg \
  --hostname dev.worker.neptu.sudigital.com

az containerapp hostname bind \
  --name neptu-worker-dev --resource-group sudigital-rg \
  --hostname dev.worker.neptu.sudigital.com \
  --environment sudigital-env-dev --validation-method CNAME
```

---

## 6. Complete File Change Summary

### Files to Modify (42 files)

| File                                                               | Change                                               | Effort |
| ------------------------------------------------------------------ | ---------------------------------------------------- | ------ |
| `packages/drizzle-orm/src/client.ts`                               | D1 → node-postgres with `pg.Pool`                    | Small  |
| `packages/drizzle-orm/drizzle.config.ts`                           | dialect → postgresql, credentials → `DATABASE_URL`   | Small  |
| `packages/drizzle-orm/package.json`                                | Add `pg` + `@types/pg`, remove CF types              | Small  |
| `packages/drizzle-orm/src/schemas/users.ts`                        | pgTable, boolean, timestamp, jsonb                   | Medium |
| `packages/drizzle-orm/src/schemas/readings.ts`                     | pgTable, timestamp, jsonb                            | Small  |
| `packages/drizzle-orm/src/schemas/payments.ts`                     | pgTable, numeric, timestamp                          | Medium |
| `packages/drizzle-orm/src/schemas/token-transactions.ts`           | pgTable, numeric, timestamp                          | Medium |
| `packages/drizzle-orm/src/schemas/daily-readings.ts`               | pgTable, timestamp, jsonb                            | Small  |
| `packages/drizzle-orm/src/schemas/user-rewards.ts`                 | pgTable, numeric, timestamp                          | Small  |
| `packages/drizzle-orm/src/schemas/user-streaks.ts`                 | pgTable, timestamp                                   | Small  |
| `packages/drizzle-orm/src/schemas/referrals.ts`                    | pgTable, numeric, timestamp                          | Small  |
| `packages/drizzle-orm/src/schemas/pricing-plans.ts`                | pgTable, numeric, boolean, jsonb                     | Medium |
| `packages/drizzle-orm/src/schemas/crypto-market.ts`                | pgTable, doublePrecision, serial, timestamp          | Medium |
| `packages/drizzle-orm/src/services/crypto-market-service.ts`       | Fix 2 SQLite datetime() queries                      | Small  |
| `packages/drizzle-orm/src/repositories/user-repository.ts`         | toISOString → new Date()                             | Tiny   |
| `packages/drizzle-orm/src/repositories/user-streak-repository.ts`  | toISOString → new Date() (×3)                        | Tiny   |
| `packages/drizzle-orm/src/repositories/pricing-plan-repository.ts` | toISOString → new Date()                             | Tiny   |
| `apps/api/src/index.ts`                                            | Remove CF bindings, add `Bun.serve()`                | Medium |
| `apps/api/package.json`                                            | Update scripts (wrangler → bun)                      | Small  |
| `apps/worker/src/index.ts`                                         | Remove CF bindings, add cron + `Bun.serve()`         | Large  |
| `apps/worker/package.json`                                         | Add `bullmq`, `ioredis`, update scripts              | Small  |
| `apps/worker/src/routes/oracle.ts`                                 | Remove Env, use module-level cache/db                | Medium |
| `apps/worker/src/routes/colosseum.ts`                              | Remove Env, use module-level cache/db                | Medium |
| `apps/worker/src/routes/crypto.ts`                                 | Remove Env, use module-level db                      | Medium |
| `apps/worker/src/routes/colosseum-project.ts`                      | Remove Env, use module-level cache/db                | Small  |
| `apps/worker/src/colosseum/heartbeat.ts`                           | KVNamespace → CacheStore, D1Database → Database      | Small  |
| `apps/worker/src/colosseum/heartbeat-helpers.ts`                   | KVNamespace → CacheStore (×5)                        | Small  |
| `apps/worker/src/colosseum/orchestrator.ts`                        | KVNamespace → CacheStore, D1Database → Database (×7) | Medium |
| `apps/worker/src/colosseum/analytics.ts`                           | KVNamespace → CacheStore (×6)                        | Small  |
| `apps/worker/src/colosseum/engagement-booster.ts`                  | KVNamespace → CacheStore (×4)                        | Small  |
| `apps/worker/src/colosseum/voting-strategy.ts`                     | KVNamespace → CacheStore (×2)                        | Small  |
| `apps/worker/src/colosseum/post-creator.ts`                        | KVNamespace → CacheStore (×3)                        | Small  |
| `apps/worker/src/colosseum/crypto-posts.ts`                        | KVNamespace → CacheStore (×3)                        | Small  |
| `apps/worker/src/colosseum/crypto-posts-market.ts`                 | KVNamespace → CacheStore (×2)                        | Small  |
| `apps/worker/src/colosseum/trending-analyzer.ts`                   | KVNamespace → CacheStore (×2)                        | Small  |
| `apps/worker/src/colosseum/trend-detector.ts`                      | KVNamespace → CacheStore (×2)                        | Small  |
| `apps/worker/src/colosseum/project-spotlight.ts`                   | KVNamespace → CacheStore (×1)                        | Small  |
| `apps/worker/src/colosseum/agent-cosmic-profile.ts`                | KVNamespace → CacheStore (×3)                        | Small  |
| `apps/worker/src/colosseum/final-day-forecast.ts`                  | KVNamespace → CacheStore (×2)                        | Small  |
| `apps/worker/src/colosseum/crypto-market-fetcher.ts`               | D1Database → Database (×2)                           | Small  |
| `apps/worker/src/ai/oracle.ts`                                     | KVNamespace → CacheStore (×4)                        | Small  |
| `packages/shared/src/index.ts`                                     | Add `http://localhost:3000` to CORS                  | Tiny   |

### Files to Create (7 files)

| File                                 | Purpose                           |
| ------------------------------------ | --------------------------------- |
| `apps/api/Dockerfile`                | API container image (Bun)         |
| `apps/worker/Dockerfile`             | Worker container image (Bun)      |
| `apps/worker/src/cache.ts`           | CacheStore interface + redisCache |
| `apps/worker/src/cron.ts`            | BullMQ repeatable job scheduler   |
| `.github/workflows/deploy-azure.yml` | CI/CD: deploy backend to Azure    |
| `.github/workflows/pr-check.yml`     | CI/CD: PR quality gate            |
| `docker-compose.azure.yml`           | Local testing with PostgreSQL     |

### Files NOT Changed

All web app code, all docs code, `@neptu/wariga`, `@neptu/solana`, `@neptu/shared` (except CORS tweak), `@neptu/mobile`, `@neptu/cli`.

---

## 7. Data Migration: D1 (SQLite) → PostgreSQL

### Strategy

```bash
# 1. Export from Cloudflare D1
wrangler d1 export neptu-prod --output=neptu-d1-dump.sql

# 2. Generate fresh PostgreSQL schema via Drizzle
DATABASE_URL="postgresql://..." bunx drizzle-kit push

# 3. Export data as CSV from D1 (per table)
wrangler d1 execute neptu-prod --command "SELECT * FROM users" --csv > users.csv
wrangler d1 execute neptu-prod --command "SELECT * FROM readings" --csv > readings.csv
# ... repeat for each table

# 4. Import CSV into PostgreSQL
psql $DATABASE_URL -c "\COPY users FROM 'users.csv' WITH CSV HEADER"
# ... repeat for each table

# 5. Fix serial sequence after import
psql $DATABASE_URL -c "SELECT setval('crypto_market_history_id_seq', COALESCE(MAX(id), 0)) FROM crypto_market_history"
```

### Type Transformations During Import

| Column Type Change                 | Transform                                             |
| ---------------------------------- | ----------------------------------------------------- |
| `integer` boolean → `boolean`      | `0` → `false`, `1` → `true`                           |
| `text` datetime → `timestamp`      | ISO strings are compatible — PostgreSQL accepts as-is |
| `real` → `numeric`                 | No transform needed — numeric values are compatible   |
| `text` JSON → `jsonb`              | No transform needed — valid JSON strings become jsonb |
| `integer` autoincrement → `serial` | Restart sequence after import (see step 5 above)      |

### Verify Row Counts

```sql
SELECT 'users' AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'readings', COUNT(*) FROM readings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'token_transactions', COUNT(*) FROM token_transactions
UNION ALL SELECT 'daily_readings', COUNT(*) FROM daily_readings
UNION ALL SELECT 'user_rewards', COUNT(*) FROM user_rewards
UNION ALL SELECT 'user_streaks', COUNT(*) FROM user_streaks
UNION ALL SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL SELECT 'pricing_plans', COUNT(*) FROM pricing_plans
UNION ALL SELECT 'crypto_market', COUNT(*) FROM crypto_market
UNION ALL SELECT 'crypto_market_history', COUNT(*) FROM crypto_market_history;
```

---

## 8. Cost Estimate (Monthly)

| Service                    | SKU                          | Est. Cost   |
| -------------------------- | ---------------------------- | ----------- |
| Container Apps (API)       | 0.5 vCPU / 1 GiB, 1 replica  | ~$15        |
| Container Apps (Worker)    | 0.5 vCPU / 1 GiB, 1 replica  | ~$15        |
| PostgreSQL Flexible Server | Burstable B1ms, 32GB storage | ~$13        |
| Azure Cache for Redis      | Basic C0 (shared)            | ~$16\*      |
| Container Registry (ACR)   | Basic                        | ~$5         |
| Key Vault                  | Standard                     | ~$1         |
| Azure OpenAI               | Already provisioned          | (existing)  |
| CF Pages (web + docs)      | Free                         | $0          |
| **Total**                  |                              | **~$65/mo** |

> \*Redis cost is shared across multiple SUDIGITAL projects. Per-project cost is ~$5-8/mo depending on how many projects share the instance.

---

## 9. Timeline

```
Day 1     ┃ Foundation + Schema Start
          ┣━ Provision Azure resources (RG, ACR, CAE, KV, PostgreSQL)
          ┣━ Start drizzle-orm schema migration (pgTable + column types)
          ┗━ Update client.ts + drizzle.config.ts + package.json

Day 2     ┃ Schema Migration Complete
          ┣━ Finish all 10 schema files (pgTable)
          ┣━ Fix services/repos SQLite SQL → PostgreSQL SQL
          ┣━ Create CacheStore interface + memoryCache
          ┗━ Run Drizzle generate + test schema against local PostgreSQL

Day 3     ┃ Backend Refactor
          ┣━ Refactor API: remove CF bindings, add Bun.serve()
          ┣━ Refactor Worker: remove CF bindings, replace KV, add cron
          ┣━ Update all 20+ colosseum/AI files (KVNamespace → CacheStore)
          ┗━ Test locally with docker-compose.azure.yml

Day 4     ┃ Containerize & Deploy
          ┣━ Write Dockerfiles (api, worker)
          ┣━ Build & push to ACR
          ┣━ Deploy Container Apps (api, worker)
          ┗━ Data migration: D1 → PostgreSQL

Day 5     ┃ CI/CD + DNS
          ┣━ Create GitHub Actions workflows
          ┣━ Configure GitHub secrets
          ┣━ Test full push → build → deploy pipeline
          ┗━ Configure custom domains + TLS

Day 6     ┃ Go Live
          ┣━ Update DNS for api. and worker. subdomains
          ┣━ Verify CORS, Privy auth, Solana integration
          ┣━ Monitor logs (az containerapp logs show)
          ┗━ Done — web/docs on CF, backend on Azure
```

---

## 10. Risk Register

| Risk                                  | Impact | Probability | Mitigation                                                |
| ------------------------------------- | ------ | ----------- | --------------------------------------------------------- |
| Schema migration type errors          | High   | Medium      | Full audit done (§2), test against local PostgreSQL       |
| Data migration data loss              | High   | Low         | Export D1 first, verify row counts, keep D1 as backup     |
| Redis connection failure              | Medium | Low         | Reconnect logic built-in, cache miss falls through to DB  |
| Worker single-instance bottleneck     | Medium | Low         | Monitor CPU/memory, Redis shared state enables scaling    |
| Cold start on Container Apps          | Medium | Low         | `min-replicas: 1` for both API and Worker                 |
| CORS issues (CF Pages → Azure API)    | Medium | Low         | CORS origins already include production domains           |
| PostgreSQL connection limits          | Medium | Low         | B1ms supports 256 connections, pool max set to 10         |
| Privy auth callback domain            | Low    | Low         | No change — web domain stays on CF Pages                  |
| `numeric()` returns string in Drizzle | Medium | Medium      | Use `doublePrecision()` for non-financial cols, parse app |
| Bun + pg compatibility                | Low    | Low         | Bun has native PostgreSQL support via `pg` package        |

---

## 11. Environment Variables Reference

### API Container

| Variable               | Source    | Description                  |
| ---------------------- | --------- | ---------------------------- |
| `DATABASE_URL`         | Key Vault | PostgreSQL connection string |
| `ENVIRONMENT`          | Config    | `development` / `production` |
| `ADMIN_WALLET_ADDRESS` | Key Vault | Solana admin wallet          |
| `SOLANA_RPC_URL`       | Key Vault | Solana RPC endpoint          |
| `SOLANA_NETWORK`       | Config    | `devnet` / `mainnet`         |
| `PORT`                 | Config    | `3000`                       |

### Worker Container

| Variable                   | Source    | Description                                      |
| -------------------------- | --------- | ------------------------------------------------ |
| `DATABASE_URL`             | Key Vault | PostgreSQL connection string                     |
| `REDIS_URL`                | Key Vault | Redis connection string (shared across projects) |
| `AZURE_OPENAI_API_KEY`     | Key Vault | Azure OpenAI key                                 |
| `AZURE_OPENAI_ENDPOINT`    | Config    | `https://super-su.cognitiveservices.azure.com/`  |
| `AZURE_OPENAI_DEPLOYMENT`  | Config    | `gpt-4o-mini`                                    |
| `AZURE_OPENAI_API_VERSION` | Config    | `2024-04-01-preview`                             |
| `COLOSSEUM_API_KEY`        | Key Vault | Colosseum hackathon API key                      |
| `COLOSSEUM_AGENT_ID`       | Config    | `206`                                            |
| `COLOSSEUM_AGENT_NAME`     | Config    | `Neptu`                                          |
| `COINGECKO_API_KEY`        | Key Vault | CoinGecko API key                                |
| `ENVIRONMENT`              | Config    | `development` / `production`                     |
| `PORT`                     | Config    | `8080`                                           |

### Web Frontend (build-time)

| Variable              | Description                                         |
| --------------------- | --------------------------------------------------- |
| `VITE_API_URL`        | API URL (→ `https://api.neptu.sudigital.com`)       |
| `VITE_WORKER_URL`     | Worker URL (→ `https://worker.neptu.sudigital.com`) |
| `VITE_PRIVY_APP_ID`   | Privy authentication app ID                         |
| `VITE_SOLANA_RPC_URL` | Solana RPC URL                                      |
| `VITE_SOLANA_NETWORK` | `devnet` / `mainnet`                                |

---

## 12. Manual Deploy (Docker Build, Push & Update)

> **Why manual?** The `packages/wariga` package (Balinese calendar engine) is proprietary IP and not committed to the Git repository. CI/CD workflows use stubs for typecheck/lint/test, but production containers must be built locally where the real source exists.

### Prerequisites

- Docker installed and running
- Azure CLI authenticated (`az login`)
- Access to `sudigitalacr` container registry

### 12.1 API Deployment

```bash
# 1. Login to Azure Container Registry
az acr login --name sudigitalacr

# 2. Build the API image (from monorepo root)
cd /path/to/neptu.ai
docker build -f apps/api/Dockerfile -t sudigitalacr.azurecr.io/neptu-api:v$(date +%Y%m%d%H%M%S) .

# 3. Verify the build locally (optional)
docker run --rm sudigitalacr.azurecr.io/neptu-api:v<TAG> cat /app/packages/drizzle-orm/src/schemas/users.ts

# 4. Push to ACR
docker push sudigitalacr.azurecr.io/neptu-api:v<TAG>

# 5. Update the Container App (creates a new revision)
az containerapp update \
  --name neptu-api \
  --resource-group sudigital-rg \
  --image sudigitalacr.azurecr.io/neptu-api:v<TAG>

# 6. Verify the new revision is healthy
az containerapp revision list \
  --name neptu-api \
  --resource-group sudigital-rg \
  --output table

# 7. Test the health endpoint
curl -s https://api.neptu.sudigital.com/health
```

### 12.2 Worker Deployment

```bash
# 1. Build the Worker image
docker build -f apps/worker/Dockerfile -t sudigitalacr.azurecr.io/neptu-worker:v$(date +%Y%m%d%H%M%S) .

# 2. Push to ACR
docker push sudigitalacr.azurecr.io/neptu-worker:v<TAG>

# 3. Update the Container App
az containerapp update \
  --name neptu-worker \
  --resource-group sudigital-rg \
  --image sudigitalacr.azurecr.io/neptu-worker:v<TAG>

# 4. Verify
az containerapp revision list \
  --name neptu-worker \
  --resource-group sudigital-rg \
  --output table
```

### 12.3 Web Deployment (Cloudflare Pages)

```bash
# Web is deployed to Cloudflare Pages — no Docker needed
cd apps/web
bun run deploy
```

### 12.4 Revision Management

```bash
# List all revisions
az containerapp revision list \
  --name neptu-api \
  --resource-group sudigital-rg \
  --output table

# Restart a revision (forces image re-pull for same tag)
az containerapp revision restart \
  --name neptu-api \
  --resource-group sudigital-rg \
  --revision <REVISION_NAME>

# Deactivate an old/unhealthy revision
az containerapp revision deactivate \
  --name neptu-api \
  --resource-group sudigital-rg \
  --revision <REVISION_NAME>

# View container logs
az containerapp logs show \
  --name neptu-api \
  --resource-group sudigital-rg \
  --revision <REVISION_NAME> \
  --tail 50
```

### 12.5 Database Migrations (Production)

```bash
# Connect to production PostgreSQL
PGPASSWORD='<PASSWORD>' psql \
  -h sudigital-db.postgres.database.azure.com \
  -U sudigital \
  -d neptu

# Run migration SQL files from packages/drizzle-orm/drizzle/
# Example: applying a new migration
PGPASSWORD='<PASSWORD>' psql \
  -h sudigital-db.postgres.database.azure.com \
  -U sudigital \
  -d neptu \
  -f packages/drizzle-orm/drizzle/<MIGRATION_FILE>.sql
```

### 12.6 Important Notes

| Topic               | Detail                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Image tags**      | Always use unique tags (e.g., `v20260218210744`) — using `latest` may serve cached images                       |
| **Wariga IP**       | Real `packages/wariga` source only exists locally — CI/CD uses stubs that return empty data                     |
| **Dockerfile deps** | Ensure all workspace packages are copied in Dockerfiles (`logger`, `shared`, `drizzle-orm`, `solana`, `wariga`) |
| **Health check**    | API health: `https://api.neptu.sudigital.com/health` — returns `{"status":"ok"}`                                |
| **Rollback**        | To rollback, redeploy the previous image tag — old revisions can be reactivated                                 |

### 12.7 Quick Deploy Script

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./deploy-api.sh
TAG="v$(date +%Y%m%d%H%M%S)"
IMAGE="sudigitalacr.azurecr.io/neptu-api:${TAG}"

echo "🔑 Logging in to ACR..."
az acr login --name sudigitalacr

echo "🏗️  Building API image: ${IMAGE}"
docker build -f apps/api/Dockerfile -t "${IMAGE}" .

echo "📤 Pushing to ACR..."
docker push "${IMAGE}"

echo "🚀 Deploying to Container Apps..."
az containerapp update \
  --name neptu-api \
  --resource-group sudigital-rg \
  --image "${IMAGE}"

echo "⏳ Waiting for revision..."
sleep 15

echo "✅ Revision status:"
az containerapp revision list \
  --name neptu-api \
  --resource-group sudigital-rg \
  --output table

echo "🏥 Health check:"
curl -s https://api.neptu.sudigital.com/health
echo ""
```

---

## 13. Next Steps

1. **Start Phase 1** — provision Azure resources with the CLI commands above
2. **Start Phase 2** — begin schema migration (`pgTable` conversion)
3. Test locally with `docker-compose.azure.yml` before deploying
4. Consider upgrading to mainnet Solana after Azure migration stabilizes
