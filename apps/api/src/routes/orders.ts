import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { orderSyncQueue } from '../queues/index.js';

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth] }, async (request) => {
    const orders = await prisma.order.findMany({
      where: { userId: request.userContext!.userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return { orders };
  });

  fastify.get('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { id: string };
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: request.userContext!.userId },
      include: { items: true, labels: true, invoices: true, returns: true },
    });

    if (!order) {
      return reply.code(404).send({ message: 'Order not found' });
    }

    return { order };
  });

  fastify.post('/sync', { preHandler: [requireAuth] }, async (request) => {
    const linkedAccounts = await prisma.linkedAccount.findMany({ where: { userId: request.userContext!.userId, syncEnabled: true } });
    await Promise.all(
      linkedAccounts.map((account) =>
        orderSyncQueue.add(
          'sync-orders',
          { userId: request.userContext!.userId, linkedAccountId: account.id, platform: account.platform },
          { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
        ),
      ),
    );

    return { queued: linkedAccounts.length };
  });
};

export default orderRoutes;
