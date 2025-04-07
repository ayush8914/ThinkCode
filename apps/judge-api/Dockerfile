FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/judge-api/package*.json ./apps/judge-api/
COPY packages/db/package*.json ./packages/db/
COPY packages/typescript-config/package*.json ./packages/typescript-config/

RUN npm ci

COPY . .

RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build --workspace=judge-api

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/apps/judge-api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/judge-api/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

EXPOSE 3001

CMD ["node", "dist/index.js"]