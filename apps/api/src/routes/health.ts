import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ status: 'ok', service: 'agencyfic-api' }));
  fastify.get('/live', async () => ({
    status: 'alive',
    service: 'agencyfic-api',
    uptimeSeconds: Math.floor(process.uptime()),
  }));

  fastify.get('/ready', async (_, reply) => {
    const checks = {
      database: false,
      redis: false,
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      checks.database = false;
    }

    try {
      const pong = await redis.ping();
      checks.redis = pong === 'PONG';
    } catch {
      checks.redis = false;
    }

    if (!checks.database || !checks.redis) {
      return reply.code(503).send({ status: 'degraded', service: 'agencyfic-api', checks });
    }

    return { status: 'ready', service: 'agencyfic-api', checks };
  });
};

export default healthRoutes;
