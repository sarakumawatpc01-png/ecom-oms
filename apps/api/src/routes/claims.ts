import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const claimsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth] }, async (request) => {
    const claims = await prisma.claim.findMany({ where: { userId: request.userContext!.userId }, orderBy: { createdAt: 'desc' } });
    return { claims };
  });

  fastify.post('/', { preHandler: [requireAuth] }, async (request) => {
    const body = request.body as { orderId: string; platform: 'amazon' | 'flipkart' | 'meesho'; claimReason: string; claimAmount?: number };

    const claim = await prisma.claim.create({
      data: {
        userId: request.userContext!.userId,
        orderId: body.orderId,
        platform: body.platform,
        claimReason: body.claimReason,
        claimAmount: body.claimAmount,
        claimStatus: 'raised',
        claimRaisedAt: new Date(),
      },
    });

    return { claim };
  });
};

export default claimsRoutes;
