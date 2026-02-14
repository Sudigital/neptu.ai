FROM oven/bun:1.2-slim
WORKDIR /app

# Copy workspace package.json files for dependency resolution
COPY package.json bun.lock* ./
COPY apps/worker/package.json apps/worker/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY apps/cli/package.json apps/cli/
COPY docs/package.json docs/
COPY packages/drizzle-orm/package.json packages/drizzle-orm/
COPY packages/shared/package.json packages/shared/
COPY packages/solana/package.json packages/solana/
COPY packages/wariga/package.json packages/wariga/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/

# Install production dependencies only
RUN bun install --frozen-lockfile --production --ignore-scripts

# Copy application source
COPY apps/worker/src apps/worker/src
COPY apps/worker/tsconfig.json apps/worker/
COPY packages/drizzle-orm/src packages/drizzle-orm/src
COPY packages/drizzle-orm/tsconfig.json packages/drizzle-orm/
COPY packages/shared/src packages/shared/src
COPY packages/solana/src packages/solana/src
COPY packages/wariga/src packages/wariga/src
COPY packages/typescript-config packages/typescript-config
COPY tsconfig.json ./

EXPOSE 8080
CMD ["bun", "run", "apps/worker/src/index.ts"]
