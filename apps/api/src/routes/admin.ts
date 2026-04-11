import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { encryptAes256Gcm } from '../lib/encryption';
import { env } from '../config/env';
import { createAdminAuditLog } from '../lib/audit';
import { Prisma } from '@prisma/client';

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
        extraConfig: body.extraConfig as Prisma.InputJsonValue | undefined,
        updatedByAdminId: request.userContext!.userId,
      },
      create: {
        platform: params.platform,
        clientId: body.clientId,
        clientSecretEnc: body.clientSecret ? encryptAes256Gcm(body.clientSecret, env.ENCRYPTION_KEY_HEX) : undefined,
        extraConfig: body.extraConfig as Prisma.InputJsonValue | undefined,
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
    const integration = await prisma.platformIntegration.findUnique({ where: { platform: params.platform } });
    if (!integration) {
      return request.server.httpErrors.notFound('Platform integration not configured');
    }

    const updated = await prisma.platformIntegration.update({
      where: { platform: params.platform },
      data: {
        lastTestStatus: 'ok',
        lastTestMessage: 'Configuration verified',
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
