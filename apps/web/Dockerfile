FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

RUN npm install

COPY . .

RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma

WORKDIR /app/apps/web
RUN npm run build

EXPOSE 3005

CMD ["npm", "start"]