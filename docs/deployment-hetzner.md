# Hetzner Deployment Guide

## Services

- `web` (Next.js)
- `api` (Fastify)
- `postgres`
- `redis`
- `nginx`

## Steps

1. Provision Ubuntu VPS on Hetzner.
2. Install Docker and Docker Compose plugin.
3. Clone repository and configure `.env` values.
4. Start stack:
   - `docker compose -f docker/docker-compose.yml up -d --build`
5. Run Prisma migration and seed inside API container.
6. Configure TLS with Certbot and update NGINX server blocks.
7. Add monitoring/log shipping and backup jobs for PostgreSQL.
