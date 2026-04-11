import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { createAdminAuditLog } from '../lib/audit';

const legalDefaults: Record<string, string> = {
  terms: 'Terms and Conditions will be configured by superadmin.',
  privacy: 'Privacy Policy will be configured by superadmin.',
  refund: 'Refund Policy will be configured by superadmin.',
};

const brandingDefaults = {
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#7c3aed',
  accentColor: '#f97316',
};

const siteSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth, requireRole(['admin'])] }, async () => {
    const settings = await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
    return { settings };
  });

  fastify.put('/:key', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request) => {
    const params = request.params as { key: string };
    const body = request.body as { value?: string; valueType?: string; description?: string };

    const setting = await prisma.siteSetting.upsert({
      where: { key: params.key },
      update: {
        value: body.value,
        valueType: body.valueType ?? 'string',
        description: body.description,
        updatedAt: new Date(),
      },
      create: {
        key: params.key,
        value: body.value,
        valueType: body.valueType ?? 'string',
        description: body.description,
      },
    });

    await createAdminAuditLog({
      adminId: request.userContext!.userId,
      action: 'site.setting.upsert',
      targetType: 'site_setting',
      targetId: setting.id,
      details: { key: params.key },
      ipAddress: request.ip,
    });

    return { setting };
  });

  fastify.get('/public/legal/:slug', async (request, reply) => {
    const params = request.params as { slug: 'terms' | 'privacy' | 'refund' };
    if (!['terms', 'privacy', 'refund'].includes(params.slug)) {
      return reply.code(404).send({ message: 'Legal content not found' });
    }

    const key = `legal.${params.slug}`;
    const setting = await prisma.siteSetting.findUnique({ where: { key } });
    return {
      slug: params.slug,
      content: setting?.value ?? legalDefaults[params.slug],
      updatedAt: setting?.updatedAt ?? null,
    };
  });

  fastify.get('/public/branding', async () => {
    const keys = ['branding.logoUrl', 'branding.faviconUrl', 'branding.primaryColor', 'branding.accentColor'];
    const settings = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
    const settingMap = new Map(settings.map((setting) => [setting.key, setting.value ?? '']));

    return {
      logoUrl: settingMap.get('branding.logoUrl') || brandingDefaults.logoUrl,
      faviconUrl: settingMap.get('branding.faviconUrl') || brandingDefaults.faviconUrl,
      primaryColor: settingMap.get('branding.primaryColor') || brandingDefaults.primaryColor,
      accentColor: settingMap.get('branding.accentColor') || brandingDefaults.accentColor,
    };
  });
};

export default siteSettingsRoutes;
