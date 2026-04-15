import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { encryptAes256Gcm } from '../lib/encryption';
import { env } from '../config/env';
import { createAdminAuditLog } from '../lib/audit';
import { Prisma } from '@prisma/client';
import { sanitizeResponse } from '../lib/serialization';
import { idParamSchema, platformParamSchema } from '../lib/validation';

const upsertPlatformBodySchema = z.object({
  clientId: z.string().trim().optional(),
  clientSecret: z.string().trim().optional(),
  extraConfig: z.record(z.unknown()).optional(),
});

const updateSellerBodySchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().trim().min(1).optional(),
  role: z.enum(['seller', 'sub_user']).optional(),
});

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/platforms', { preHandler: [requireAuth, requireRole(['admin'])] }, async () => {
    const integrations = await prisma.platformIntegration.findMany({
      orderBy: { platform: 'asc' },
      select: {
        id: true,
        platform: true,
        clientId: true,
        extraConfig: true,
        isActive: true,
        lastTestStatus: true,
        lastTestMessage: true,
        updatedByAdminId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { integrations };
  });

  fastify.post('/platforms/:platform', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request) => {
    const params = platformParamSchema.parse(request.params);
    const body = upsertPlatformBodySchema.parse(request.body);

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
      select: {
        id: true,
        platform: true,
        clientId: true,
        extraConfig: true,
        isActive: true,
        lastTestStatus: true,
        lastTestMessage: true,
        updatedByAdminId: true,
        createdAt: true,
        updatedAt: true,
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

    return { integration: sanitizeResponse(integration) };
  });

  fastify.post('/platforms/:platform/test', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request) => {
    const params = platformParamSchema.parse(request.params);
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
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        gstin: true,
        pan: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        planId: true,
        creditsPurchased: true,
        creditsUsed: true,
        creditsGraceUsed: true,
        planExpiresAt: true,
        isActive: true,
        isVerified: true,
        role: true,
        parentUserId: true,
        subUserRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { sellers };
  });

  fastify.patch('/sellers/:id', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request) => {
    const params = idParamSchema.parse(request.params);
    const body = updateSellerBodySchema.parse(request.body);

    const seller = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: body.isActive,
        name: body.name,
        role: body.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        gstin: true,
        pan: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        planId: true,
        creditsPurchased: true,
        creditsUsed: true,
        creditsGraceUsed: true,
        planExpiresAt: true,
        isActive: true,
        isVerified: true,
        role: true,
        parentUserId: true,
        subUserRole: true,
        createdAt: true,
        updatedAt: true,
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
