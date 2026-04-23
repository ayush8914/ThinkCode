FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/judge-api/package*.json ./apps/judge-api/
COPY packages/db/package*.json ./packages/db/

RUN npm install

COPY . .

RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build --workspace=judge-api

EXPOSE 3001

CMD ["node", "apps/judge-api/dist/index.js"]