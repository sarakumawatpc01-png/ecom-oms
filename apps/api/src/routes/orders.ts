import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { enqueueNotificationJob, orderSyncQueue } from '../queues/index';
import { emitToUser } from '../lib/realtime';
import { idParamSchema } from '../lib/validation';
import { nestOrderRawData } from '../lib/serialization';

const syncBodySchema = z
  .object({
    platform: z.enum(['amazon', 'flipkart', 'meesho']).optional(),
    force: z.boolean().optional(),
  })
  .passthrough();

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth] }, async (request) => {
    const orders = await prisma.order.findMany({
      where: { userId: request.userContext!.userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return { orders: orders.map((order) => nestOrderRawData(order)) };
  });

  fastify.get('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: request.userContext!.userId },
      include: { items: true, labels: true, invoices: true, returns: true },
    });

    if (!order) {
      return reply.code(404).send({ message: 'Order not found' });
    }

    return { order: nestOrderRawData(order) };
  });

  fastify.post('/sync', { preHandler: [requireAuth] }, async (request) => {
    syncBodySchema.parse(request.body ?? {});
    const userId = request.userContext!.userId;
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

    const notification = await prisma.notificationLog.create({
      data: {
        userId,
        channel: 'in_app',
        type: 'order_sync_queued',
        title: 'Order sync started',
        message: `Queued sync for ${linkedAccounts.length} linked account(s).`,
      },
    });

    emitToUser(fastify, userId, 'order.update', {
      kind: 'sync_queued',
      queuedAccounts: linkedAccounts.length,
      at: new Date().toISOString(),
    });
    emitToUser(fastify, userId, 'notification.new', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      sentAt: notification.sentAt.toISOString(),
    });
    await enqueueNotificationJob({
      userId,
      type: 'order_sync_queued',
      title: notification.title,
      message: notification.message,
      channels: ['email', 'sms', 'whatsapp'],
    });

    return { queued: linkedAccounts.length };
  });
};

export default orderRoutes;
