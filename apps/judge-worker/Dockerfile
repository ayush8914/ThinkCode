FROM node:20-slim AS builder
WORKDIR /app

# Install compilation tools for C++ support
RUN apt-get update && apt-get install -y \
    g++ \
    python3 \
    make \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY turbo.json ./
COPY apps/judge-worker/package*.json ./apps/judge-worker/
COPY packages/db/package*.json ./packages/db/
COPY packages/typescript-config/package*.json ./packages/typescript-config/

RUN npm ci

COPY . .

RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build --workspace=judge-worker

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production

# Keep compilation tools for runtime code execution
RUN apt-get update && apt-get install -y \
    g++ \
    python3 \
    time \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/apps/judge-worker/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/judge-worker/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

CMD ["node", "dist/worker.js"]