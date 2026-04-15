import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { platformSchema } from '../lib/validation';

const createClaimBodySchema = z.object({
  orderId: z.string().uuid(),
  platform: platformSchema,
  claimReason: z.string().trim().min(1),
  claimAmount: z.number().finite().nonnegative().optional(),
});

const claimsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth] }, async (request) => {
    const claims = await prisma.claim.findMany({ where: { userId: request.userContext!.userId }, orderBy: { createdAt: 'desc' } });
    return { claims };
  });

  fastify.post('/', { preHandler: [requireAuth] }, async (request) => {
    const body = createClaimBodySchema.parse(request.body);

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
