import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

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
};

export default integrationRoutes;
