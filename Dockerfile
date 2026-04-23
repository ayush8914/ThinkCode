FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npm install -g turbo

RUN cd packages/db && npx prisma generate && npm run build

# RUN cd apps/judge-worker && npm i @repo/db && npm run build

EXPOSE 3005

CMD ["turbo", "run", "dev", "--filter=web"]