FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/utils/package*.json ./packages/utils/
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npm run prisma:generate && npm run build --workspace @agencyfic/api

EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "@agencyfic/api"]
