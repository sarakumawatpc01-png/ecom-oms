# Agencyfic OMS

Multi-tenant Order Management System for Amazon India, Flipkart, and Meesho.

## Monorepo Structure

- `apps/web` – Next.js 14 frontend
- `apps/api` – Fastify API backend
- `packages/ui` – Shared UI components
- `packages/utils` – Shared utilities
- `prisma` – Prisma schema and seed
- `docker` – Docker Compose and NGINX
- `docs` – Deployment and architecture docs
  - `docs/operations-runbook.md` – Incident handling runbook
  - `docs/probe-alert-checklist.md` – Production probe and alert checklist

## Quick Start

1. Copy env:
   - `cp .env.example .env`
2. Install deps:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations:
   - `npm run prisma:migrate`
5. Seed sample data:
   - `npm run db:seed`
6. Start apps:
   - `npm run dev`

## Scripts

- `npm run build`
- `npm run lint`
- `npm run test`

## Security

- Never commit secrets.
- Sensitive credentials are encrypted using AES-256-GCM.
