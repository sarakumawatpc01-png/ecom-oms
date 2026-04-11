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

    const existing = await prisma.notificationLog.findFirst({
      where: { id: params.id, userId: request.userContext!.userId },
    });

    if (!existing) {
      return request.server.httpErrors.notFound('Notification not found');
    }

    const notification = await prisma.notificationLog.update({
      where: { id: existing.id },
      data: { isRead: true, readAt: new Date() },
    });

    return { notification };
  });
};

export default notificationRoutes;
