import type { FastifyPluginAsync } from 'fastify';
import cron from 'node-cron';
import { orderSyncQueue } from '../queues/index';
import { prisma } from '../lib/prisma';

const schedulerPlugin: FastifyPluginAsync = async (fastify) => {
  cron.schedule('*/5 * * * *', async () => {
    const activeAccounts = await prisma.linkedAccount.findMany({ where: { syncEnabled: true } });
    await Promise.all(
      activeAccounts.map((account) =>
        orderSyncQueue.add(
          'scheduled-order-sync',
          { userId: account.userId, linkedAccountId: account.id, platform: account.platform },
          { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
        ),
      ),
    );
    fastify.log.info(`Scheduled ${activeAccounts.length} order sync jobs`);
  });
};

export default schedulerPlugin;
