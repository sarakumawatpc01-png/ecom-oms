import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const checkoutBodySchema = z.object({
  planId: z.string().uuid(),
  amountInr: z.number().finite().nonnegative(),
  ordersPurchased: z.number().int().positive(),
});

const billingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/plans', { preHandler: [requireAuth] }, async () => {
    const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });
    return { plans };
  });

  fastify.get('/transactions', { preHandler: [requireAuth] }, async (request) => {
    const transactions = await prisma.billingTransaction.findMany({
      where: { userId: request.userContext!.userId },
      orderBy: { createdAt: 'desc' },
    });
    return { transactions };
  });

  fastify.post('/checkout', { preHandler: [requireAuth] }, async (request) => {
    const body = checkoutBodySchema.parse(request.body);

    const tx = await prisma.billingTransaction.create({
      data: {
        userId: request.userContext!.userId,
        transactionType: 'purchase',
        planId: body.planId,
        amountInr: body.amountInr,
        ordersPurchased: body.ordersPurchased,
        paymentStatus: 'pending',
        razorpayOrderId: `order_${Date.now()}`,
      },
    });

    return { checkout: { transactionId: tx.id, razorpayOrderId: tx.razorpayOrderId } };
  });
};

export default billingRoutes;
