# Agencyfic OMS

Multi-tenant Order Management System monorepo for Amazon India, Flipkart, and Meesho operations.

This README is written to make installation straightforward for both humans and AI agents on a fresh server.

## 1) Repository layout

- `apps/web` - Next.js frontend (port `3000`)
- `apps/api` - Fastify API (port `4000`)
- `packages/ui` - shared UI package
- `packages/utils` - shared utility package
- `prisma` - schema + seed
- `docker` - Docker Compose + NGINX reverse proxy config
- `docs/operations-runbook.md` - incident handling runbook
- `docs/probe-alert-checklist.md` - readiness/liveness and monitoring checklist
- `docs/deployment-hetzner.md` - short Hetzner-specific deployment notes

## 2) Prerequisites

### For local/dev install

- Node.js `20.x` (recommended, matches Dockerfiles)
- npm `10+`
- PostgreSQL `16+`
- Redis `7+`

### For server install (Docker path, recommended)

- Docker Engine
- Docker Compose plugin
- Open ports: `80` (and `443` if TLS is added)

## 3) Environment variables

Create env file from template:

```bash
cp .env.example .env
```

Minimum values you must set for real server use:

- `NODE_ENV=production`
- `JWT_ACCESS_SECRET` (long random string)
- `JWT_REFRESH_SECRET` (long random string)
- `ENCRYPTION_KEY_HEX` (exactly 64 hex characters)
- `DATABASE_URL`
- `REDIS_URL`
- `WEB_URL`
- `NEXT_PUBLIC_API_URL`

Important: API startup fails in production if JWT or encryption values are left as defaults.

Optional integration variables in `.env.example`:

- S3: `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`
- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Seed-only credentials: `SEED_SUPERADMIN_PASSWORD`, `SEED_SELLER_PASSWORD`

## 4) Local development install (without Docker)

From repo root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Default URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Health: `http://localhost:4000/health`

## 5) Production/server install with Docker Compose (recommended)

### Step 1: clone and enter repository

```bash
git clone <your-repo-url>
cd ecom-oms
```

### Step 2: prepare environment

```bash
cp .env.example .env
```

Edit `.env` with production values before continuing.

### Step 3: build and start services

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Services started by compose:

- `web` (Next.js)
- `api` (Fastify)
- `postgres` (PostgreSQL 16)
- `redis` (Redis 7)
- `nginx` (reverse proxy on port 80)

### Step 4: run database migration + seed in API container

```bash
docker compose -f docker/docker-compose.yml exec api npx prisma migrate deploy --schema prisma/schema.prisma
docker compose -f docker/docker-compose.yml exec api npm run db:seed
```

Notes:

- In production, seeding requires non-empty `SEED_SUPERADMIN_PASSWORD` and `SEED_SELLER_PASSWORD`.
- If not set in non-production, random fallback passwords are generated.

### Step 5: verify health

```bash
curl -sS http://localhost/health
curl -sS http://localhost/health/live
curl -sS http://localhost/health/ready
```

Expected readiness behavior:

- `/health/ready` returns `200` only when PostgreSQL and Redis are both reachable.
- returns `503` with check details when degraded.

## 6) Non-Docker server install (system packages + Node)

1. Install Node.js 20, PostgreSQL, Redis.
2. Clone repo and create `.env`.
3. From repo root:

```bash
npm install
npm run prisma:generate
npx prisma migrate deploy --schema prisma/schema.prisma
npm run db:seed
npm run build
```

4. Start API and Web as background services (systemd/pm2):

```bash
npm run start --workspace @agencyfic/api
npm run start --workspace @agencyfic/web
```

5. Put NGINX/Caddy in front and route:
- `/api/*` to API (`:4000`)
- everything else to Web (`:3000`)

Reference NGINX proxy config exists at `docker/nginx/default.conf`.

## 7) First login after seed

Seed creates these users:

- Superadmin: `superadmin@agencyfic.com`
- Seller: `seller1@example.com`

Use passwords from:

- `SEED_SUPERADMIN_PASSWORD`
- `SEED_SELLER_PASSWORD`

## 8) Common commands

From repo root:

```bash
# dev
npm run dev

# quality checks
npm run lint
npm run build
npm run test

# prisma
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

Workspace-specific:

```bash
npm run dev --workspace @agencyfic/api
npm run dev --workspace @agencyfic/web
```

## 9) Health, operations, and production hardening

- API health endpoints:
  - `/health`
  - `/health/live`
  - `/health/ready`
- Use:
  - `docs/operations-runbook.md`
  - `docs/probe-alert-checklist.md`
- Add TLS (Certbot or managed LB) before public exposure.
- Rotate all secrets regularly.
- Never commit `.env` or credentials.

## 10) Troubleshooting

- If `next` or `jest` is missing: run `npm install` at repo root.
- If readiness is degraded: validate `DATABASE_URL`, `REDIS_URL`, and service reachability.
- If API fails at startup in production: verify non-default JWT/encryption env values.
- If seed fails in production: set both seed password env vars before running seed.
