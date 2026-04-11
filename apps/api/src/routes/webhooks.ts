import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/flipkart', async (request) => {
    const payload = request.body as Record<string, unknown>;
    const event = await prisma.webhookEvent.create({
      data: {
        platform: 'flipkart',
        eventType: String(payload.type ?? 'unknown'),
        payload,
      },
    });

    return { ok: true, id: event.id };
  });

  fastify.post('/amazon', async (request) => {
    const payload = request.body as Record<string, unknown>;
    const event = await prisma.webhookEvent.create({
      data: {
        platform: 'amazon',
        eventType: String(payload.type ?? 'unknown'),
        payload,
      },
    });

    return { ok: true, id: event.id };
  });
};

export default webhookRoutes;
