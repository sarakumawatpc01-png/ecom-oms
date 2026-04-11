import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { aiProcessingQueue } from '../queues/index.js';

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/listing-optimize', { preHandler: [requireAuth] }, async (request) => {
    const body = request.body as { title: string; description: string; platform?: 'amazon' | 'flipkart' | 'meesho' };

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

    return { jobId: job.id };
  });

  fastify.post('/image-generate', { preHandler: [requireAuth] }, async (request) => {
    const body = request.body as { prompt: string; productCategory?: string };

    const job = await prisma.aiJob.create({
      data: {
        userId: request.userContext!.userId,
        jobType: 'image_generate',
        status: 'queued',
        inputData: body,
      },
    });

    await aiProcessingQueue.add('ai-image-generate', { aiJobId: job.id }, { attempts: 2 });

    return { jobId: job.id };
  });
};

export default aiRoutes;
