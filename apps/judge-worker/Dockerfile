FROM node:20-slim AS builder

# Install build tools and compilers
RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    python3 \
    make \
    openjdk-17-jdk-headless \
    bc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/judge-worker/package*.json ./apps/judge-worker/
COPY packages/db/package*.json ./packages/db/
COPY packages/typescript-config/package*.json ./packages/typescript-config/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build --workspace=judge-worker

# Production stage
FROM node:20-slim AS runner

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    python3 \
    openjdk-17-jre-headless \
    bc \
    time \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash judge

WORKDIR /app

# Copy built application
COPY --from=builder --chown=judge:judge /app/apps/judge-worker/dist ./dist
COPY --from=builder --chown=judge:judge /app/apps/judge-worker/scripts ./scripts
COPY --from=builder --chown=judge:judge /app/node_modules ./node_modules
COPY --from=builder --chown=judge:judge /app/package*.json ./

# Make sandbox script executable
RUN chmod +x /app/scripts/sandbox.sh

# Create temp directory for code execution
RUN mkdir -p /tmp/code && \
    chown judge:judge /tmp/code && \
    chmod 700 /tmp/code

# Switch to non-root user
USER judge

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

CMD ["node", "dist/worker.js"]