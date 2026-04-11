import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth] }, async (request) => {
    const notifications = await prisma.notificationLog.findMany({ where: { userId: request.userContext!.userId }, orderBy: { sentAt: 'desc' } });
    return { notifications };
  });

  fastify.patch('/:id/read', { preHandler: [requireAuth] }, async (request) => {
    const params = request.params as { id: string };

    const notification = await prisma.notificationLog.update({
      where: { id: params.id },
      data: { isRead: true, readAt: new Date() },
    });

    return { notification };
  });
};

export default notificationRoutes;
