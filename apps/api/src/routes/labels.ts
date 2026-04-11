import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const labelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:orderId', { preHandler: [requireAuth] }, async (request) => {
    const params = request.params as { orderId: string };

    const labels = await prisma.label.findMany({ where: { userId: request.userContext!.userId, orderId: params.orderId } });
    return { labels };
  });

  fastify.post('/:orderId/generate', { preHandler: [requireAuth] }, async (request) => {
    const params = request.params as { orderId: string };
    const order = await prisma.order.findFirst({
      where: { id: params.orderId, userId: request.userContext!.userId },
    });

    if (!order) {
      return { message: 'Order not found' };
    }

    const label = await prisma.label.create({
      data: {
        userId: request.userContext!.userId,
        orderId: params.orderId,
        platform: order.platform,
        labelFormat: 'a4',
        storageKey: `labels/${request.userContext!.userId}/${params.orderId}.pdf`,
      },
    });

    return { label };
  });
};

export default labelRoutes;
