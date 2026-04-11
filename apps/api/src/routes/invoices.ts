import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const invoiceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:orderId', { preHandler: [requireAuth] }, async (request) => {
    const params = request.params as { orderId: string };

    const invoices = await prisma.invoice.findMany({ where: { userId: request.userContext!.userId, orderId: params.orderId } });
    return { invoices };
  });

  fastify.post('/:orderId/generate', { preHandler: [requireAuth] }, async (request) => {
    const params = request.params as { orderId: string };

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        userId: request.userContext!.userId,
        orderId: params.orderId,
        total: 0,
        storageKey: `invoices/${request.userContext!.userId}/${params.orderId}.pdf`,
      },
    });

    return { invoice };
  });
};

export default invoiceRoutes;
