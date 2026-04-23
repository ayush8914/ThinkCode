FROM node:20-slim

# Install compilers for C/C++
RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/judge-worker/package*.json ./apps/judge-worker/
COPY packages/db/package*.json ./packages/db/

RUN npm install

COPY . .

RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build --workspace=judge-worker

# Create temp directory for code execution
RUN mkdir -p /tmp/code && chmod 777 /tmp/code

CMD ["node", "apps/judge-worker/dist/worker.js"]