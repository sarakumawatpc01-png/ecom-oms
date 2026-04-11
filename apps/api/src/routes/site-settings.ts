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

const communicationSettingKeys = {
  otpExpiryMinutes: 'auth.otp.expiryMinutes',
  emailWebhookUrl: 'notifications.emailWebhookUrl',
  smsWebhookUrl: 'notifications.smsWebhookUrl',
  whatsappWebhookUrl: 'notifications.whatsappWebhookUrl',
  emailEnabled: 'notifications.emailEnabled',
  smsEnabled: 'notifications.smsEnabled',
  whatsappEnabled: 'notifications.whatsappEnabled',
} as const;

const communicationDefaults = {
  otpExpiryMinutes: 10,
  emailWebhookUrl: '',
  smsWebhookUrl: '',
  whatsappWebhookUrl: '',
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: false,
};

type CommunicationSettingsBody = Partial<{
  otpExpiryMinutes: number;
  emailWebhookUrl: string;
  smsWebhookUrl: string;
  whatsappWebhookUrl: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}>;

function parseBooleanSetting(value: string | null | undefined, fallback: boolean) {
  if (value == null) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  return fallback;
}

function parseIntegerSetting(value: string | null | undefined, fallback: number) {
  if (value == null || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validateUrlOrEmpty(value: string, fieldName: string) {
  if (!value) {
    return;
  }
  try {
    new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL`);
  }
}

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

  fastify.get('/admin/communication-settings', { preHandler: [requireAuth, requireRole(['admin'])] }, async () => {
    const keys = Object.values(communicationSettingKeys);
    const settings = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
    const settingMap = new Map(settings.map((setting) => [setting.key, setting.value ?? '']));

    return {
      otpExpiryMinutes: parseIntegerSetting(
        settingMap.get(communicationSettingKeys.otpExpiryMinutes),
        communicationDefaults.otpExpiryMinutes,
      ),
      emailWebhookUrl: settingMap.get(communicationSettingKeys.emailWebhookUrl) || communicationDefaults.emailWebhookUrl,
      smsWebhookUrl: settingMap.get(communicationSettingKeys.smsWebhookUrl) || communicationDefaults.smsWebhookUrl,
      whatsappWebhookUrl: settingMap.get(communicationSettingKeys.whatsappWebhookUrl) || communicationDefaults.whatsappWebhookUrl,
      emailEnabled: parseBooleanSetting(settingMap.get(communicationSettingKeys.emailEnabled), communicationDefaults.emailEnabled),
      smsEnabled: parseBooleanSetting(settingMap.get(communicationSettingKeys.smsEnabled), communicationDefaults.smsEnabled),
      whatsappEnabled: parseBooleanSetting(
        settingMap.get(communicationSettingKeys.whatsappEnabled),
        communicationDefaults.whatsappEnabled,
      ),
    };
  });

  fastify.put('/admin/communication-settings', { preHandler: [requireAuth, requireRole(['admin'])] }, async (request, reply) => {
    const body = request.body as CommunicationSettingsBody;

    if (typeof body.otpExpiryMinutes === 'number') {
      if (!Number.isInteger(body.otpExpiryMinutes) || body.otpExpiryMinutes < 1 || body.otpExpiryMinutes > 30) {
        return reply.code(400).send({ message: 'otpExpiryMinutes must be an integer between 1 and 30' });
      }
    }

    if (typeof body.emailWebhookUrl === 'string') {
      try {
        validateUrlOrEmpty(body.emailWebhookUrl.trim(), 'emailWebhookUrl');
      } catch (error) {
        return reply.code(400).send({ message: (error as Error).message });
      }
    }
    if (typeof body.smsWebhookUrl === 'string') {
      try {
        validateUrlOrEmpty(body.smsWebhookUrl.trim(), 'smsWebhookUrl');
      } catch (error) {
        return reply.code(400).send({ message: (error as Error).message });
      }
    }
    if (typeof body.whatsappWebhookUrl === 'string') {
      try {
        validateUrlOrEmpty(body.whatsappWebhookUrl.trim(), 'whatsappWebhookUrl');
      } catch (error) {
        return reply.code(400).send({ message: (error as Error).message });
      }
    }

    const updates: Array<{ key: string; value: string; valueType: string; description: string }> = [];
    if (typeof body.otpExpiryMinutes === 'number') {
      updates.push({
        key: communicationSettingKeys.otpExpiryMinutes,
        value: String(body.otpExpiryMinutes),
        valueType: 'number',
        description: 'OTP expiry duration in minutes for email verification',
      });
    }
    if (typeof body.emailWebhookUrl === 'string') {
      updates.push({
        key: communicationSettingKeys.emailWebhookUrl,
        value: body.emailWebhookUrl.trim(),
        valueType: 'string',
        description: 'Webhook URL for outbound email notification delivery',
      });
    }
    if (typeof body.smsWebhookUrl === 'string') {
      updates.push({
        key: communicationSettingKeys.smsWebhookUrl,
        value: body.smsWebhookUrl.trim(),
        valueType: 'string',
        description: 'Webhook URL for outbound SMS notification delivery',
      });
    }
    if (typeof body.whatsappWebhookUrl === 'string') {
      updates.push({
        key: communicationSettingKeys.whatsappWebhookUrl,
        value: body.whatsappWebhookUrl.trim(),
        valueType: 'string',
        description: 'Webhook URL for outbound WhatsApp notification delivery',
      });
    }
    if (typeof body.emailEnabled === 'boolean') {
      updates.push({
        key: communicationSettingKeys.emailEnabled,
        value: String(body.emailEnabled),
        valueType: 'boolean',
        description: 'Enable or disable email notifications globally',
      });
    }
    if (typeof body.smsEnabled === 'boolean') {
      updates.push({
        key: communicationSettingKeys.smsEnabled,
        value: String(body.smsEnabled),
        valueType: 'boolean',
        description: 'Enable or disable SMS notifications globally',
      });
    }
    if (typeof body.whatsappEnabled === 'boolean') {
      updates.push({
        key: communicationSettingKeys.whatsappEnabled,
        value: String(body.whatsappEnabled),
        valueType: 'boolean',
        description: 'Enable or disable WhatsApp notifications globally',
      });
    }

    if (updates.length === 0) {
      return reply.code(400).send({ message: 'No supported settings provided' });
    }

    await Promise.all(
      updates.map((update) =>
        prisma.siteSetting.upsert({
          where: { key: update.key },
          update: {
            value: update.value,
            valueType: update.valueType,
            description: update.description,
            updatedAt: new Date(),
          },
          create: {
            key: update.key,
            value: update.value,
            valueType: update.valueType,
            description: update.description,
          },
        }),
      ),
    );

    await createAdminAuditLog({
      adminId: request.userContext!.userId,
      action: 'site.setting.communication.update',
      targetType: 'site_setting',
      details: {
        keys: updates.map((update) => update.key),
      },
      ipAddress: request.ip,
    });

    return { ok: true, updatedKeys: updates.map((update) => update.key) };
  });
};

export default siteSettingsRoutes;
