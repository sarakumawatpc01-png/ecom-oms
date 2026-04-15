import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { aiProcessingQueue } from '../queues/index';
import { emitToUser } from '../lib/realtime';
import { platformSchema } from '../lib/validation';

const listingOptimizeBodySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  platform: platformSchema.optional(),
});

const imageGenerateBodySchema = z.object({
  prompt: z.string().trim().min(1),
  productCategory: z.string().trim().optional(),
});

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/listing-optimize', { preHandler: [requireAuth] }, async (request) => {
    const body = listingOptimizeBodySchema.parse(request.body);

    const job = await prisma.aiJob.create({
      data: {
        userId: request.userContext!.userId,
        jobType: 'listing_optimize',
        status: 'queued',
        platform: body.platform,
        inputData: body,
      },
    });

    await aiProcessingQueue.add('ai-listing-optimize', { aiJobId: job.id }, { attempts: 2 });
    emitToUser(fastify, request.userContext!.userId, 'ai.completion', {
      kind: 'queued',
      jobType: 'listing_optimize',
      aiJobId: job.id,
      at: new Date().toISOString(),
    });

    return { jobId: job.id };
  });

  fastify.post('/image-generate', { preHandler: [requireAuth] }, async (request) => {
    const body = imageGenerateBodySchema.parse(request.body);

    const job = await prisma.aiJob.create({
      data: {
        userId: request.userContext!.userId,
        jobType: 'image_generate',
        status: 'queued',
        inputData: body,
      },
    });

    await aiProcessingQueue.add('ai-image-generate', { aiJobId: job.id }, { attempts: 2 });
    emitToUser(fastify, request.userContext!.userId, 'ai.completion', {
      kind: 'queued',
      jobType: 'image_generate',
      aiJobId: job.id,
      at: new Date().toISOString(),
    });

    return { jobId: job.id };
  });
};

export default aiRoutes;
