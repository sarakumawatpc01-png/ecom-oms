import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { orderSyncQueue } from '../queues/index';

async function enqueueWebhookSyncJobs(platform: 'amazon' | 'flipkart', eventId: string) {
  const linkedAccounts = await prisma.linkedAccount.findMany({
    where: {
      platform,
      syncEnabled: true,
    },
    select: { id: true, userId: true, platform: true },
  });

  await Promise.all(
    linkedAccounts.map((account) =>
      orderSyncQueue.add(
        'webhook-order-sync',
        { userId: account.userId, linkedAccountId: account.id, platform: account.platform },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          jobId: `${eventId}:${account.id}`,
        },
      ),
    ),
  );
}

const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/flipkart', async (request) => {
    const payload = request.body as Record<string, unknown>;
    const event = await prisma.webhookEvent.create({
      data: {
        platform: 'flipkart',
        eventType: String(payload.type ?? 'unknown'),
        payload: payload as Prisma.InputJsonValue,
      },
    });
    await enqueueWebhookSyncJobs('flipkart', event.id);

    return { ok: true, id: event.id };
  });

  fastify.post('/amazon', async (request) => {
    const payload = request.body as Record<string, unknown>;
    const event = await prisma.webhookEvent.create({
      data: {
        platform: 'amazon',
        eventType: String(payload.type ?? 'unknown'),
        payload: payload as Prisma.InputJsonValue,
      },
    });
    await enqueueWebhookSyncJobs('amazon', event.id);

    return { ok: true, id: event.id };
  });
};

export default webhookRoutes;
