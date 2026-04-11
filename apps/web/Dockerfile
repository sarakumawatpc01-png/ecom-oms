FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/utils/package*.json ./packages/utils/
RUN npm install

COPY . .
RUN npm run build --workspace @agencyfic/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@agencyfic/web"]
