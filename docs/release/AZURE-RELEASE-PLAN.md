# Neptu.ai — Azure Release Plan

> Hybrid deployment: Cloudflare (web + docs) → Azure (API + Worker + Database)

## 1. Architecture Overview

### Current State

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
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│        CLOUDFLARE (stays)       │   │          AZURE (new)             │
├─────────────────────────────────┤   ├──────────────────────────────────┤
│                                 │   │                                  │
│  ┌────────────┐ ┌────────────┐  │   │  ┌──────────────────────────┐   │
│  │ CF Pages   │ │ CF Pages   │  │   │  │  Azure Container Apps    │   │
│  │ @neptu/web │ │ @neptu/docs│  │   │  │  ┌────────┐ ┌─────────┐ │   │
│  │ React SPA  │ │ VitePress  │  │   │  │  │  API   │ │ Worker  │ │   │
│  └─────┬──────┘ └────────────┘  │   │  │  │ :3000  │ │  :8080  │ │   │
│        │                        │   │  │  └───┬────┘ └────┬────┘ │   │
│        │ HTTPS                  │   │  └──────┼───────────┼──────┘   │
│        └────────────────────────┼───┼─────────┘           │          │
│                                 │   │              ┌──────┴──────┐   │
│                                 │   │              │ Container   │   │
│                                 │   │              │ Apps Jobs   │   │
│                                 │   │              │ (4 crons)   │   │
│                                 │   │              └──────┬──────┘   │
│                                 │   │                     │          │
│                                 │   │  ┌─────────┐ ┌─────┴───────┐  │
│                                 │   │  │  Azure  │ │ libSQL /    │  │
│                                 │   │  │ OpenAI  │ │ PostgreSQL  │  │
│                                 │   │  │(exists) │ │             │  │
│                                 │   │  └─────────┘ └─────────────┘  │
│                                 │   │                                │
│                                 │   │  ┌─────────┐ ┌─────────────┐  │
│                                 │   │  │  ACR    │ │ Key Vault   │  │
│                                 │   │  └─────────┘ └─────────────┘  │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

### What Stays vs. What Moves

| Service         | Stays on Cloudflare | Moves to Azure | Why                                                    |
| --------------- | :-----------------: | :------------: | ------------------------------------------------------ |
| `@neptu/web`    |         ✅          |       —        | CF Pages is free, global CDN, zero config              |
| `@neptu/docs`   |         ✅          |       —        | Same — already deployed, works well                    |
| `@neptu/api`    |          —          |       ✅       | Decouple from D1/Workers runtime                       |
| `@neptu/worker` |          —          |       ✅       | Decouple from D1/KV, better cron control               |
| Database        |          —          |       ✅       | D1 → libSQL or PostgreSQL on Azure                     |
| Cache (KV)      |          —          |       ✅       | KV → in-memory or Redis on Azure                       |
| Azure OpenAI    |          —          |       ✅       | Already there (`super-su.cognitiveservices.azure.com`) |
| `@neptu/mobile` |          —          |       —        | Expo — not in scope                                    |
| `@neptu/cli`    |          —          |       —        | Bun binary — not in scope                              |

---

## 2. Database Decision: libSQL vs PostgreSQL

Your schemas use 11 tables, all defined with `sqliteTable` from `drizzle-orm/sqlite-core`. The current client uses `drizzle-orm/d1`. This makes the database choice critical.

### Option A: libSQL (Recommended — Least Code Changes)

**libSQL is a fork of SQLite.** Your schemas stay 100% unchanged.

| Aspect                  | Detail                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **Schema changes**      | **ZERO** — all `sqliteTable` definitions stay as-is                                          |
| **Client change**       | Only [client.ts](packages/drizzle-orm/src/client.ts) — swap D1 driver for libSQL HTTP driver |
| **Drizzle dialect**     | Stays `sqlite`                                                                               |
| **Hosting options**     | Turso (managed) or self-hosted libSQL server in Container Apps                               |
| **Your docker-compose** | Already has `ghcr.io/tursodatabase/libsql-server` — you know it works                        |
| **Data migration**      | Trivial — D1 exports SQLite, libSQL imports SQLite natively                                  |
| **Cost**                | Self-hosted: $0 (runs in same Container Apps env). Turso: free tier = 9GB                    |

**Code diff (only file that changes):**

```diff
// packages/drizzle-orm/src/client.ts
- import { drizzle } from "drizzle-orm/d1";
- import type { DrizzleD1Database } from "drizzle-orm/d1";
- export type Database = DrizzleD1Database<typeof schema>;
- export function createDatabase(d1: D1Database): Database {
-   return drizzle(d1, { schema });
- }

+ import { drizzle } from "drizzle-orm/libsql";
+ import { createClient } from "@libsql/client";
+ import type { LibSQLDatabase } from "drizzle-orm/libsql";
+ export type Database = LibSQLDatabase<typeof schema>;
+ let db: Database | null = null;
+ export function createDatabase(url?: string, authToken?: string): Database {
+   if (!db) {
+     const client = createClient({
+       url: url ?? process.env.TURSO_DATABASE_URL!,
+       authToken: authToken ?? process.env.TURSO_AUTH_TOKEN,
+     });
+     db = drizzle(client, { schema });
+   }
+   return db;
+ }
```

### Option B: PostgreSQL (More Work, More Scalable)

| Aspect              | Detail                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schema changes**  | **ALL 11 files** — rewrite `sqliteTable` → `pgTable`, fix types                                                                                                |
| **Client change**   | Rewrite to `drizzle-orm/node-postgres` with `pg.Pool`                                                                                                          |
| **Drizzle dialect** | Changes to `postgresql`                                                                                                                                        |
| **Type changes**    | `integer({mode:"boolean"})` → `boolean()`, `real()` → `numeric()`, `text("created_at").default(sql\`datetime('now')\`)`→`timestamp("created_at").defaultNow()` |
| **Hosting**         | Azure Database for PostgreSQL Flexible Server                                                                                                                  |
| **Data migration**  | Must transform SQLite dump → PostgreSQL format                                                                                                                 |
| **Cost**            | ~$13/mo (Burstable B1ms)                                                                                                                                       |

**Schema migration example (must repeat for all 11 files):**

```diff
// packages/drizzle-orm/src/schemas/users.ts
- import { text, sqliteTable, index, integer } from "drizzle-orm/sqlite-core";
- export const users = sqliteTable("users", {
-   onboarded: integer("onboarded", { mode: "boolean" }).default(false),
-   createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),

+ import { text, pgTable, index, boolean, timestamp } from "drizzle-orm/pg-core";
+ export const users = pgTable("users", {
+   onboarded: boolean("onboarded").default(false),
+   createdAt: timestamp("created_at").notNull().defaultNow(),
```

### Recommendation

| Criteria              |          libSQL          |      PostgreSQL       |
| --------------------- | :----------------------: | :-------------------: |
| Code changes          |       **~1 file**        |       ~15 files       |
| Risk                  |         Very low         |        Medium         |
| Time to migrate       |          Hours           |         Days          |
| Data migration        |   Native SQLite import   |  Transform required   |
| You already use it    |   ✅ (docker-compose)    |          No           |
| Long-term scalability | Good (Turso scales well) |       Excellent       |
| Azure native service  | No (self-host or Turso)  | Yes (Flexible Server) |

**Go with libSQL** for the hackathon — you can always migrate to PostgreSQL later. The Drizzle ORM abstraction makes that switch straightforward.

---

## 3. Migration Plan

### Phase 1: Azure Foundation (Day 1)

#### 1.1 Provision Resources

```bash
# Resource Group
az group create --name rg-neptu-prod --location southeastasia

# Container Apps Environment
az containerapp env create \
  --name cae-neptu-prod \
  --resource-group rg-neptu-prod \
  --location southeastasia

# Azure Container Registry
az acr create --name acrNeptu --resource-group rg-neptu-prod --sku Basic

# Azure Key Vault (secrets management)
az keyvault create \
  --name kv-neptu-prod \
  --resource-group rg-neptu-prod \
  --location southeastasia
```

If using PostgreSQL instead of libSQL, also:

```bash
az postgres flexible-server create \
  --name psql-neptu-prod \
  --resource-group rg-neptu-prod \
  --location southeastasia \
  --tier Burstable \
  --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 16 \
  --admin-user neptuadmin \
  --admin-password <PASSWORD>
```

#### 1.2 Store Secrets in Key Vault

```bash
az keyvault secret set --vault-name kv-neptu-prod --name "AZURE-OPENAI-API-KEY" --value "<value>"
az keyvault secret set --vault-name kv-neptu-prod --name "COLOSSEUM-API-KEY" --value "<value>"
az keyvault secret set --vault-name kv-neptu-prod --name "COINGECKO-API-KEY" --value "<value>"
az keyvault secret set --vault-name kv-neptu-prod --name "PRIVY-APP-SECRET" --value "<value>"
az keyvault secret set --vault-name kv-neptu-prod --name "TURSO-AUTH-TOKEN" --value "<value>"
```

---

### Phase 2: Code Refactoring (Day 1-2)

#### 2.1 Database Client — `@neptu/drizzle-orm`

**With libSQL (recommended):**

| File                                                                             | Change                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [packages/drizzle-orm/src/client.ts](packages/drizzle-orm/src/client.ts)         | Swap `drizzle-orm/d1` → `drizzle-orm/libsql`                 |
| [packages/drizzle-orm/package.json](packages/drizzle-orm/package.json)           | Add `@libsql/client` dep, remove `@cloudflare/workers-types` |
| [packages/drizzle-orm/drizzle.config.ts](packages/drizzle-orm/drizzle.config.ts) | Update to libSQL URL                                         |
| All `src/schemas/*.ts`                                                           | **No changes**                                               |
| All `src/services/*.ts`                                                          | **No changes**                                               |
| All `src/repositories/*.ts`                                                      | **No changes**                                               |

**With PostgreSQL:**

| File                                                                             | Change                                                   |
| -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [packages/drizzle-orm/src/client.ts](packages/drizzle-orm/src/client.ts)         | Rewrite to `drizzle-orm/node-postgres`                   |
| [packages/drizzle-orm/package.json](packages/drizzle-orm/package.json)           | Add `pg`, remove CF types                                |
| [packages/drizzle-orm/drizzle.config.ts](packages/drizzle-orm/drizzle.config.ts) | Change dialect to `postgresql`                           |
| All 11 `src/schemas/*.ts`                                                        | Rewrite: `sqliteTable` → `pgTable`, fix all column types |
| All `src/services/*.ts`                                                          | Review for SQLite-specific SQL                           |
| All `src/repositories/*.ts`                                                      | Review for SQLite-specific SQL                           |

#### 2.2 API — `@neptu/api`

Remove Cloudflare Worker runtime, run as standard Hono + Node/Bun server:

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

  // ... middleware stays the same ...

- app.use("*", async (c, next) => {
-   const db = createDatabase(c.env.DB);
-   c.set("db", db);
-   c.set("adminWalletAddress", c.env.ADMIN_WALLET_ADDRESS);
-   await next();
- });

+ const db = createDatabase(); // reads TURSO_DATABASE_URL from env
+ app.use("*", async (c, next) => {
+   c.set("db", db);
+   c.set("adminWalletAddress", process.env.ADMIN_WALLET_ADDRESS);
+   await next();
+ });

  // ... routes stay the same ...

- export default app;

+ import { serve } from "@hono/node-server";
+ const port = Number(process.env.PORT || 3000);
+ console.log(`Neptu API running on port ${port}`);
+ serve({ fetch: app.fetch, port });
```

**Package.json changes:**

```diff
// apps/api/package.json
  "dependencies": {
+   "@hono/node-server": "^1.13.0",
    // remove @cloudflare/workers-types from devDeps
  },
  "scripts": {
-   "dev": "wrangler dev --port 3000 --remote",
+   "dev": "bun run --hot src/index.ts",
-   "build": "wrangler deploy --dry-run --outdir dist",
+   "build": "bun build src/index.ts --outdir dist --target bun",
-   "deploy": "wrangler deploy --env production",
+   "deploy": "echo 'Deployed via Azure Container Apps CI/CD'",
  }
```

#### 2.3 Worker — `@neptu/worker`

Same pattern: remove CF bindings, replace KV with a simple in-memory cache (or Map), run as Hono server:

```diff
// apps/worker/src/index.ts

- interface Env {
-   DB: D1Database;
-   CACHE: KVNamespace;
-   // ... all azure/colosseum vars from env bindings
- }
-
- const app = new Hono<{ Bindings: Env }>();

+ const app = new Hono();

  // ... middleware stays ...

  // Replace KV with in-memory Map (or Redis if needed)
+ const cache = new Map<string, { value: string; expiry: number }>();
+
+ function cacheGet(key: string): string | null {
+   const entry = cache.get(key);
+   if (!entry || Date.now() > entry.expiry) { cache.delete(key); return null; }
+   return entry.value;
+ }
+ function cacheSet(key: string, value: string, ttlSeconds: number): void {
+   cache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
+ }

  // Daily reading route — replace KV calls:
- const cached = await c.env.CACHE.get(`daily:${date}`);
+ const cached = cacheGet(`daily:${date}`);

- await c.env.CACHE.put(`daily:${date}`, JSON.stringify(reading), { expirationTtl: 86400 });
+ cacheSet(`daily:${date}`, JSON.stringify(reading), 86400);

  // DB — use createDatabase() from env vars
- const db = createDatabase(c.env.DB);
+ const db = createDatabase();

  // Read config from process.env instead of c.env
- const heartbeat = new HeartbeatScheduler({
-   COLOSSEUM_API_KEY: env.COLOSSEUM_API_KEY,
-   ...
- });
+ const heartbeat = new HeartbeatScheduler({
+   COLOSSEUM_API_KEY: process.env.COLOSSEUM_API_KEY!,
+   ...
+ });
```

#### 2.4 Extract Cron Jobs

Create standalone entry points for Azure Container Apps Jobs:

```typescript
// apps/worker/src/jobs/reply.ts
import { createDatabase } from "@neptu/drizzle-orm";
import { HeartbeatScheduler } from "../colosseum";

const db = createDatabase();
const heartbeat = new HeartbeatScheduler({
  /* from process.env */
});
await heartbeat.runHeartbeat("reply_comments");
process.exit(0);
```

```typescript
// apps/worker/src/jobs/comment.ts
// Same pattern — "comment_others" phase + optional "vote" at min%15

// apps/worker/src/jobs/post.ts
// Same pattern — "post_thread" phase + optional "other_activity" at min%20

// apps/worker/src/jobs/daily.ts
// generateDailyReadings() + refreshCryptoMarketData()
```

#### 2.5 Update CORS Origins

```diff
// packages/shared/src/index.ts
  export const CORS_ALLOWED_ORIGINS = [
    "https://neptu.sudigital.com",
    "https://neptu-web-production.pages.dev",
    "http://localhost:3001",
+   "http://localhost:3000",
  ] as const;
```

Web stays on CF Pages → no CORS origin URL changes needed for production. The API just accepts requests from the same origins.

---

### Phase 3: Containerization (Day 2-3)

#### 3.1 Dockerfile for API

```dockerfile
# apps/api/Dockerfile
FROM oven/bun:1.2 AS deps
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock* bunfig.toml ./

# Copy package.json for each workspace member needed
COPY apps/api/package.json apps/api/
COPY packages/drizzle-orm/package.json packages/drizzle-orm/
COPY packages/shared/package.json packages/shared/
COPY packages/wariga/package.json packages/wariga/
COPY packages/solana/package.json packages/solana/

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.2-slim AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/ ./packages/

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
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/ ./packages/

COPY apps/worker/ apps/worker/
COPY packages/ packages/
COPY package.json bunfig.toml ./

EXPOSE 8080
ENV PORT=8080
CMD ["bun", "run", "apps/worker/src/index.ts"]
```

#### 3.3 Dockerfile for libSQL (if self-hosting)

```dockerfile
# infra/libsql/Dockerfile (or just use the image directly)
FROM ghcr.io/tursodatabase/libsql-server:latest
ENV SQLD_NODE=primary
EXPOSE 8080
```

#### 3.4 docker-compose.azure.yml (local testing)

```yaml
# docker-compose.azure.yml — simulates the Azure deployment locally
services:
  libsql:
    image: ghcr.io/tursodatabase/libsql-server:latest
    ports:
      - 8080:8080
    volumes:
      - libsql_data:/var/lib/sqld
    environment:
      - SQLD_NODE=primary

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - 3000:3000
    depends_on:
      - libsql
    environment:
      - TURSO_DATABASE_URL=http://libsql:8080
      - ENVIRONMENT=development
      - PORT=3000

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    ports:
      - 8081:8080
    depends_on:
      - libsql
    environment:
      - TURSO_DATABASE_URL=http://libsql:8080
      - AZURE_OPENAI_ENDPOINT=https://super-su.cognitiveservices.azure.com/
      - AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
      - AZURE_OPENAI_API_VERSION=2024-04-01-preview
      - ENVIRONMENT=development
      - PORT=8080

volumes:
  libsql_data:
```

---

### Phase 4: Azure Deployment (Day 3-4)

#### 4.1 Build & Push Images

```bash
az acr login --name acrNeptu

# Build from repo root
docker build -f apps/api/Dockerfile -t acrneptu.azurecr.io/neptu-api:latest .
docker build -f apps/worker/Dockerfile -t acrneptu.azurecr.io/neptu-worker:latest .

docker push acrneptu.azurecr.io/neptu-api:latest
docker push acrneptu.azurecr.io/neptu-worker:latest
```

#### 4.2 Deploy libSQL Server (if self-hosting)

```bash
az containerapp create \
  --name neptu-libsql \
  --resource-group rg-neptu-prod \
  --environment cae-neptu-prod \
  --image ghcr.io/tursodatabase/libsql-server:latest \
  --target-port 8080 \
  --ingress internal \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars SQLD_NODE=primary
```

> **Alternative:** Use [Turso](https://turso.tech) managed libSQL instead. Free tier gives 9GB storage, 500M row reads/mo. Set `TURSO_DATABASE_URL=libsql://<your-db>.turso.io` and `TURSO_AUTH_TOKEN=<token>`.

#### 4.3 Deploy API

```bash
az containerapp create \
  --name neptu-api \
  --resource-group rg-neptu-prod \
  --environment cae-neptu-prod \
  --image acrneptu.azurecr.io/neptu-api:latest \
  --registry-server acrneptu.azurecr.io \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --secrets \
    turso-db-url=<TURSO_URL_OR_INTERNAL_LIBSQL_URL> \
    turso-auth-token=<TOKEN> \
    privy-app-secret=<PRIVY_APP_SECRET> \
  --env-vars \
    TURSO_DATABASE_URL=secretref:turso-db-url \
    TURSO_AUTH_TOKEN=secretref:turso-auth-token \
    PRIVY_APP_SECRET=secretref:privy-app-secret \
    ENVIRONMENT=production \
    SOLANA_NETWORK=devnet \
    PORT=3000
```

#### 4.4 Deploy Worker

```bash
az containerapp create \
  --name neptu-worker \
  --resource-group rg-neptu-prod \
  --environment cae-neptu-prod \
  --image acrneptu.azurecr.io/neptu-worker:latest \
  --registry-server acrneptu.azurecr.io \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 2 \
  --cpu 0.5 \
  --memory 1Gi \
  --secrets \
    turso-db-url=<TURSO_URL> \
    turso-auth-token=<TOKEN> \
    azure-openai-key=<KEY> \
    colosseum-key=<KEY> \
    coingecko-key=<KEY> \
  --env-vars \
    TURSO_DATABASE_URL=secretref:turso-db-url \
    TURSO_AUTH_TOKEN=secretref:turso-auth-token \
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

#### 4.5 Deploy Cron Jobs

```bash
# Reply to comments (every 3 min)
az containerapp job create \
  --name neptu-job-reply \
  --resource-group rg-neptu-prod \
  --environment cae-neptu-prod \
  --image acrneptu.azurecr.io/neptu-worker:latest \
  --registry-server acrneptu.azurecr.io \
  --trigger-type Schedule \
  --cron-expression "*/3 * * * *" \
  --cpu 0.25 --memory 0.5Gi \
  --replica-timeout 120 \
  --env-vars "..." \
  --command "bun" -- "run" "apps/worker/src/jobs/reply.ts"

# Comment on others (every 5 min)
az containerapp job create \
  --name neptu-job-comment \
  --resource-group rg-neptu-prod \
  --environment cae-neptu-prod \
  --image acrneptu.azurecr.io/neptu-worker:latest \
  --registry-server acrneptu.azurecr.io \
  --trigger-type Schedule \
  --cron-expression "*/5 * * * *" \
  --cpu 0.25 --memory 0.5Gi \
  --replica-timeout 120 \
  --command "bun" -- "run" "apps/worker/src/jobs/comment.ts"

# Post thread (every 10 min)
az containerapp job create \
  --name neptu-job-post \
  --resource-group rg-neptu-prod \
  --environment cae-neptu-prod \
  --image acrneptu.azurecr.io/neptu-worker:latest \
  --registry-server acrneptu.azurecr.io \
  --trigger-type Schedule \
  --cron-expression "*/10 * * * *" \
  --cpu 0.25 --memory 0.5Gi \
  --replica-timeout 180 \
  --command "bun" -- "run" "apps/worker/src/jobs/post.ts"

# Daily readings + market data (midnight UTC)
az containerapp job create \
  --name neptu-job-daily \
  --resource-group rg-neptu-prod \
  --environment cae-neptu-prod \
  --image acrneptu.azurecr.io/neptu-worker:latest \
  --registry-server acrneptu.azurecr.io \
  --trigger-type Schedule \
  --cron-expression "0 0 * * *" \
  --cpu 0.5 --memory 1Gi \
  --replica-timeout 300 \
  --command "bun" -- "run" "apps/worker/src/jobs/daily.ts"
```

---

### Phase 5: CI/CD with GitHub Actions (Day 4-5)

#### 5.1 GitHub Secrets to Configure

| Secret               | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| `AZURE_CREDENTIALS`  | Service principal JSON (from `az ad sp create-for-rbac`) |
| `ACR_USERNAME`       | ACR admin username                                       |
| `ACR_PASSWORD`       | ACR admin password                                       |
| `TURSO_DATABASE_URL` | libSQL/Turso connection URL                              |
| `TURSO_AUTH_TOKEN`   | Auth token                                               |

#### 5.2 Deploy Workflow

```yaml
# .github/workflows/deploy-azure.yml
name: Deploy Backend to Azure

on:
  push:
    branches: [main]
    paths:
      - "apps/api/**"
      - "apps/worker/**"
      - "packages/**"

env:
  ACR_NAME: acrneptu
  RESOURCE_GROUP: rg-neptu-prod

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: "1.2.23" }
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run lint
      - run: bun run test

  build-and-deploy-api:
    needs: quality
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - uses: azure/docker-login@v2
        with:
          login-server: ${{ env.ACR_NAME }}.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      - name: Build & push API image
        run: |
          docker build -f apps/api/Dockerfile \
            -t ${{ env.ACR_NAME }}.azurecr.io/neptu-api:${{ github.sha }} \
            -t ${{ env.ACR_NAME }}.azurecr.io/neptu-api:latest .
          docker push ${{ env.ACR_NAME }}.azurecr.io/neptu-api --all-tags
      - name: Deploy to Container Apps
        run: |
          az containerapp update \
            --name neptu-api \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/neptu-api:${{ github.sha }}

  build-and-deploy-worker:
    needs: quality
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - uses: azure/docker-login@v2
        with:
          login-server: ${{ env.ACR_NAME }}.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      - name: Build & push Worker image
        run: |
          docker build -f apps/worker/Dockerfile \
            -t ${{ env.ACR_NAME }}.azurecr.io/neptu-worker:${{ github.sha }} \
            -t ${{ env.ACR_NAME }}.azurecr.io/neptu-worker:latest .
          docker push ${{ env.ACR_NAME }}.azurecr.io/neptu-worker --all-tags
      - name: Deploy to Container Apps
        run: |
          az containerapp update \
            --name neptu-worker \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/neptu-worker:${{ github.sha }}

  migrate-db:
    needs: quality
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: "1.2.23" }
      - run: bun install --frozen-lockfile
      - name: Run Drizzle migrations
        working-directory: packages/drizzle-orm
        run: bunx drizzle-kit migrate
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
```

#### 5.3 PR Check Workflow

```yaml
# .github/workflows/pr-check.yml
name: PR Quality Gate

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: "1.2.23" }
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run lint
      - run: bun run test
```

Web and docs continue deploying via Cloudflare Pages (existing setup — no changes needed).

---

### Phase 6: Custom Domains & DNS (Day 5)

| Domain                       | Service                         | DNS Record                                          |
| ---------------------------- | ------------------------------- | --------------------------------------------------- |
| `neptu.sudigital.com`        | CF Pages (web) — **no change**  | Already configured                                  |
| `docs.neptu.sudigital.com`   | CF Pages (docs) — **no change** | Already configured                                  |
| `api.neptu.sudigital.com`    | Azure Container Apps            | CNAME → `neptu-api.<hash>.azurecontainerapps.io`    |
| `worker.neptu.sudigital.com` | Azure Container Apps            | CNAME → `neptu-worker.<hash>.azurecontainerapps.io` |

```bash
# Add custom domain to API
az containerapp hostname add \
  --name neptu-api \
  --resource-group rg-neptu-prod \
  --hostname api.neptu.sudigital.com

# Bind managed TLS certificate
az containerapp hostname bind \
  --name neptu-api \
  --resource-group rg-neptu-prod \
  --hostname api.neptu.sudigital.com \
  --environment cae-neptu-prod \
  --validation-method CNAME

# Same for worker
az containerapp hostname add --name neptu-worker --resource-group rg-neptu-prod --hostname worker.neptu.sudigital.com
az containerapp hostname bind --name neptu-worker --resource-group rg-neptu-prod --hostname worker.neptu.sudigital.com --environment cae-neptu-prod --validation-method CNAME
```

---

## 4. Complete File Change Summary

### Files to Modify

| File                                                                             | Change                                        | Effort |
| -------------------------------------------------------------------------------- | --------------------------------------------- | ------ |
| [packages/drizzle-orm/src/client.ts](packages/drizzle-orm/src/client.ts)         | D1 → libSQL driver                            | Small  |
| [packages/drizzle-orm/package.json](packages/drizzle-orm/package.json)           | Add `@libsql/client`, remove CF types         | Small  |
| [packages/drizzle-orm/drizzle.config.ts](packages/drizzle-orm/drizzle.config.ts) | Update URL to env var                         | Small  |
| [apps/api/src/index.ts](apps/api/src/index.ts)                                   | Remove CF bindings, add `serve()`             | Medium |
| [apps/api/package.json](apps/api/package.json)                                   | Add `@hono/node-server`, update scripts       | Small  |
| [apps/worker/src/index.ts](apps/worker/src/index.ts)                             | Remove CF bindings, replace KV, add `serve()` | Medium |
| [apps/worker/package.json](apps/worker/package.json)                             | Add `@hono/node-server`, update scripts       | Small  |
| [packages/shared/src/index.ts](packages/shared/src/index.ts)                     | Add localhost:3000 CORS origin                | Tiny   |

### Files to Create

| File                                 | Purpose                            |
| ------------------------------------ | ---------------------------------- |
| `apps/api/Dockerfile`                | API container image                |
| `apps/worker/Dockerfile`             | Worker container image             |
| `apps/worker/src/jobs/reply.ts`      | Cron: reply to comments            |
| `apps/worker/src/jobs/comment.ts`    | Cron: comment on others            |
| `apps/worker/src/jobs/post.ts`       | Cron: post new threads             |
| `apps/worker/src/jobs/daily.ts`      | Cron: daily readings + market data |
| `.github/workflows/deploy-azure.yml` | CI/CD: deploy backend to Azure     |
| `.github/workflows/pr-check.yml`     | CI/CD: PR quality gate             |
| `docker-compose.azure.yml`           | Local testing of Azure-style setup |

### Files NOT Changed

All 11 schema files, all services, all repositories, all web app code, all docs code, `@neptu/wariga`, `@neptu/solana`, `@neptu/shared` (except CORS tweak).

---

## 5. Cost Estimate (Monthly)

### With libSQL (self-hosted)

| Service                       | SKU                         | Est. Cost   |
| ----------------------------- | --------------------------- | ----------- |
| Container Apps (API)          | 0.5 vCPU / 1 GiB, 1 replica | ~$15        |
| Container Apps (Worker)       | 0.5 vCPU / 1 GiB, 1 replica | ~$15        |
| Container Apps (libSQL)       | 0.5 vCPU / 1 GiB, 1 replica | ~$15        |
| Container Apps Jobs (4 crons) | Consumption-based           | ~$5         |
| Container Registry (ACR)      | Basic                       | ~$5         |
| Key Vault                     | Standard                    | ~$1         |
| Azure OpenAI                  | Already provisioned         | (existing)  |
| CF Pages (web + docs)         | Free                        | $0          |
| **Total**                     |                             | **~$56/mo** |

### With Turso (managed libSQL)

| Service                 | SKU                         | Est. Cost   |
| ----------------------- | --------------------------- | ----------- |
| Container Apps (API)    | 0.5 vCPU / 1 GiB            | ~$15        |
| Container Apps (Worker) | 0.5 vCPU / 1 GiB            | ~$15        |
| Container Apps Jobs     | Consumption                 | ~$5         |
| ACR                     | Basic                       | ~$5         |
| Turso                   | Free tier (9GB, 500M reads) | $0          |
| Key Vault               | Standard                    | ~$1         |
| **Total**               |                             | **~$41/mo** |

### With PostgreSQL

| Service                       | SKU            | Est. Cost   |
| ----------------------------- | -------------- | ----------- |
| Container Apps (API + Worker) |                | ~$30        |
| Container Apps Jobs           |                | ~$5         |
| PostgreSQL Flexible Server    | Burstable B1ms | ~$13        |
| ACR + Key Vault               |                | ~$6         |
| **Total**                     |                | **~$54/mo** |

---

## 6. Timeline

```
Day 1   ┃ Foundation
        ┣━ Provision Azure resources (RG, ACR, CAE, KV)
        ┣━ Refactor drizzle-orm client.ts (D1 → libSQL)
        ┗━ Update drizzle.config.ts + package.json

Day 2   ┃ Backend Refactor
        ┣━ Refactor API: remove CF bindings, add Hono serve()
        ┣━ Refactor Worker: remove CF bindings, replace KV
        ┣━ Extract 4 cron job entry points
        ┗━ Test locally with docker-compose.azure.yml

Day 3   ┃ Containerize & Deploy
        ┣━ Write Dockerfiles (api, worker)
        ┣━ Build & push to ACR
        ┣━ Deploy Container Apps (api, worker, libsql)
        ┗━ Deploy Container Apps Jobs (4 crons)

Day 4   ┃ CI/CD
        ┣━ Create GitHub Actions workflows
        ┣━ Configure GitHub secrets
        ┣━ Test full push → build → deploy pipeline
        ┗━ Data migration: export D1 → import to libSQL/PG

Day 5   ┃ Go Live
        ┣━ Configure custom domains + TLS
        ┣━ Update DNS for api. and worker. subdomains
        ┣━ Verify CORS, Privy auth, Solana integration
        ┣━ Monitor logs (az containerapp logs show)
        ┗━ Done — web/docs still on CF, backend on Azure
```

---

## 7. Risk Register

| Risk                                | Impact | Mitigation                                             |
| ----------------------------------- | ------ | ------------------------------------------------------ |
| libSQL self-hosted data persistence | High   | Use Azure Files volume mount or Turso managed          |
| Cold start on Container Apps        | Medium | Set `min-replicas: 1` for API                          |
| Cron job overlap / missed execution | Medium | Add idempotency checks + dead-letter logging           |
| CORS issues (CF Pages → Azure API)  | Medium | CORS origins already include production domains        |
| D1 data export format               | Low    | Use `wrangler d1 export` → SQLite dump → libSQL import |
| Privy auth callback domain          | Medium | No change needed — web domain stays the same           |

---

## 8. Data Migration

```bash
# 1. Export from Cloudflare D1
wrangler d1 export neptu-prod --output=neptu-backup.sql

# 2a. Import to Turso
turso db create neptu-prod
turso db shell neptu-prod < neptu-backup.sql

# 2b. Or import to self-hosted libSQL
curl -X POST http://<libsql-url>:8080/v1/execute \
  -H "Content-Type: application/json" \
  -d @neptu-backup.sql

# 3. Verify row counts
turso db shell neptu-prod "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'readings', COUNT(*) FROM readings UNION ALL SELECT 'payments', COUNT(*) FROM payments;"
```

---

## 9. Next Steps

1. **Decide: libSQL (Turso managed) or libSQL (self-hosted) or PostgreSQL?**
2. Implement Phase 2 code refactoring
3. Test locally with `docker-compose.azure.yml`
4. Deploy to Azure
