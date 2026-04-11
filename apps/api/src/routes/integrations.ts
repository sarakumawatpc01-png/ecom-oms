import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { enqueueNotificationJob } from '../queues/index';
import { emitToUser } from '../lib/realtime';

const integrationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/amazon/connect', { preHandler: [requireAuth] }, async () => {
    return { url: '/oauth/amazon/consent', provider: 'amazon' };
  });

  fastify.get('/amazon/callback', { preHandler: [requireAuth] }, async (request) => {
    const query = request.query as { code?: string };

    await prisma.linkedAccount.create({
      data: {
        userId: request.userContext!.userId,
        platform: 'amazon',
        accountNickname: 'Amazon Account',
        amazonRefreshToken: query.code ?? 'sample-refresh-token',
        sessionStatus: 'active',
      },
    });

    return { connected: true, provider: 'amazon' };
  });

  fastify.get('/flipkart/connect', { preHandler: [requireAuth] }, async () => {
    return { url: '/oauth/flipkart/consent', provider: 'flipkart' };
  });

  fastify.get('/flipkart/callback', { preHandler: [requireAuth] }, async (request) => {
    const query = request.query as { code?: string };

    await prisma.linkedAccount.create({
      data: {
        userId: request.userContext!.userId,
        platform: 'flipkart',
        accountNickname: 'Flipkart Account',
        flipkartAccessToken: query.code ?? 'sample-access-token',
        sessionStatus: 'active',
      },
    });

    return { connected: true, provider: 'flipkart' };
  });

  fastify.post('/:platform/session-warning', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = request.params as { platform: 'amazon' | 'flipkart' | 'meesho' };
    const body = request.body as { message?: string };
    const userId = request.userContext!.userId;

    const account = await prisma.linkedAccount.findFirst({
      where: {
        userId,
        platform: params.platform,
      },
    });

    if (!account) {
      return reply.code(404).send({ message: 'Linked account not found' });
    }

    await prisma.linkedAccount.update({
      where: { id: account.id },
      data: {
        sessionStatus: 'expired',
        lastError: body.message ?? `Session warning on ${params.platform}`,
      },
    });

    const notification = await prisma.notificationLog.create({
      data: {
        userId,
        channel: 'in_app',
        type: 'session_expired',
        title: `${params.platform.toUpperCase()} session warning`,
        message: body.message ?? 'Your marketplace session needs re-authentication.',
      },
    });

    emitToUser(fastify, userId, 'session.warning', {
      platform: params.platform,
      message: notification.message,
      at: notification.sentAt.toISOString(),
    });
    emitToUser(fastify, userId, 'notification.new', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      sentAt: notification.sentAt.toISOString(),
    });
    await enqueueNotificationJob({
      userId,
      type: 'session_expired',
      title: notification.title,
      message: notification.message,
      channels: ['email', 'sms', 'whatsapp'],
    });

    return { warned: true };
  });
};

export default integrationRoutes;
