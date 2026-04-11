import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { encryptAes256Gcm } from '@agencyfic/utils';
import { env } from '../config/env.js';
import { createAdminAuditLog } from '../lib/audit.js';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/platforms', { preHandler: [requireAuth, requireRole(['admin'])] }, async () => {
    const integrations = await prisma.platformIntegration.findMany({ orderBy: { platform: 'asc' } });
    return { integrations };
  });

  fastify.post('/platforms/:platform', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request) => {
    const params = request.params as { platform: 'amazon' | 'flipkart' | 'meesho' };
    const body = request.body as { clientId?: string; clientSecret?: string; extraConfig?: Record<string, unknown> };

    const integration = await prisma.platformIntegration.upsert({
      where: { platform: params.platform },
      update: {
        clientId: body.clientId,
        clientSecretEnc: body.clientSecret ? encryptAes256Gcm(body.clientSecret, env.ENCRYPTION_KEY_HEX) : undefined,
        extraConfig: body.extraConfig,
        updatedByAdminId: request.userContext!.userId,
      },
      create: {
        platform: params.platform,
        clientId: body.clientId,
        clientSecretEnc: body.clientSecret ? encryptAes256Gcm(body.clientSecret, env.ENCRYPTION_KEY_HEX) : undefined,
        extraConfig: body.extraConfig,
        updatedByAdminId: request.userContext!.userId,
      },
    });

    await createAdminAuditLog({
      adminId: request.userContext!.userId,
      action: 'platform.integration.upsert',
      targetType: 'platform_integration',
      targetId: integration.id,
      details: { platform: params.platform },
      ipAddress: request.ip,
    });

    return { integration };
  });

  fastify.post('/platforms/:platform/test', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request) => {
    const params = request.params as { platform: 'amazon' | 'flipkart' | 'meesho' };

    const updated = await prisma.platformIntegration.update({
      where: { platform: params.platform },
      data: {
        lastTestStatus: 'ok',
        lastTestMessage: 'Connection test simulated successfully',
      },
    });

    return { result: updated.lastTestStatus, message: updated.lastTestMessage };
  });

  fastify.get('/sellers', { preHandler: [requireAuth, requireRole(['admin'])] }, async () => {
    const sellers = await prisma.user.findMany({
      where: { role: { in: ['seller', 'sub_user'] } },
      orderBy: { createdAt: 'desc' },
    });
    return { sellers };
  });

  fastify.patch('/sellers/:id', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { isActive?: boolean; name?: string; role?: 'seller' | 'sub_user' };

    const seller = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: body.isActive,
        name: body.name,
        role: body.role,
      },
    });

    await createAdminAuditLog({
      adminId: request.userContext!.userId,
      action: 'seller.update',
      targetType: 'user',
      targetId: seller.id,
      details: body,
      ipAddress: request.ip,
    });

    return { seller };
  });
};

export default adminRoutes;
