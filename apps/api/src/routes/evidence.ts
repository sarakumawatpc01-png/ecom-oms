import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const evidenceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth] }, async (request) => {
    const files = await prisma.evidenceFile.findMany({ where: { userId: request.userContext!.userId }, orderBy: { createdAt: 'desc' } });
    return { files };
  });

  fastify.post('/upload-url', { preHandler: [requireAuth] }, async (request) => {
    const body = request.body as { orderId: string; returnId?: string; fileType: 'photo' | 'video'; captureStage: 'packing' | 'return_received' };
    const storageKey = `evidence/${request.userContext!.userId}/${body.orderId}/${Date.now()}.${body.fileType === 'photo' ? 'jpg' : 'mp4'}`;

    const evidence = await prisma.evidenceFile.create({
      data: {
        userId: request.userContext!.userId,
        orderId: body.orderId,
        returnId: body.returnId,
        fileType: body.fileType,
        captureStage: body.captureStage,
        storageLocation: 'r2_temp',
        storageKey,
        capturedAt: new Date(),
      },
    });

    return {
      uploadUrl: `https://example-r2-upload.local/${storageKey}`,
      storageKey,
      evidenceId: evidence.id,
    };
  });
};

export default evidenceRoutes;
