import { randomUUID } from 'crypto';
import { Channel, OrderStatus, Platform, Prisma, type LinkedAccount } from '@prisma/client';
import { JobsOptions, Queue, Worker, type Job, type WorkerOptions } from 'bullmq';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const connection = redis;
const isTest = process.env.NODE_ENV === 'test';
let workersStarted = false;

type QueueLike = {
  add: (name: string, data: unknown, opts?: JobsOptions) => Promise<unknown>;
};

type OrderSyncPayload = {
  userId: string;
  linkedAccountId: string;
  platform: Platform;
};

type TokenRefreshPayload = {
  userId: string;
  linkedAccountId: string;
  platform: Platform;
};

type LabelGenerationPayload = {
  userId: string;
  orderId: string;
  labelId?: string;
};

type AiProcessingPayload = {
  aiJobId: string;
};

type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  message: string;
  channels?: Channel[];
};

type MarketplaceOrderCandidate = {
  platformOrderId: string;
  status: OrderStatus;
  orderAmount?: Prisma.Decimal;
};

type NotificationDeliverySettings = {
  emailWebhookUrl?: string;
  smsWebhookUrl?: string;
  whatsappWebhookUrl?: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
};

const notificationSettingKeys = {
  emailWebhookUrl: 'notifications.emailWebhookUrl',
  smsWebhookUrl: 'notifications.smsWebhookUrl',
  whatsappWebhookUrl: 'notifications.whatsappWebhookUrl',
  emailEnabled: 'notifications.emailEnabled',
  smsEnabled: 'notifications.smsEnabled',
  whatsappEnabled: 'notifications.whatsappEnabled',
} as const;

function toBooleanSetting(value: string | null | undefined, fallback: boolean) {
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

async function getNotificationDeliverySettings(): Promise<NotificationDeliverySettings> {
  const keys = Object.values(notificationSettingKeys);
  const settings = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value ?? '']));

  return {
    // Persisted admin settings take precedence; env values remain fallback defaults.
    emailWebhookUrl: settingMap.get(notificationSettingKeys.emailWebhookUrl) || env.EMAIL_WEBHOOK_URL,
    smsWebhookUrl: settingMap.get(notificationSettingKeys.smsWebhookUrl) || env.SMS_WEBHOOK_URL,
    whatsappWebhookUrl: settingMap.get(notificationSettingKeys.whatsappWebhookUrl) || env.WHATSAPP_WEBHOOK_URL,
    emailEnabled: toBooleanSetting(settingMap.get(notificationSettingKeys.emailEnabled), true),
    smsEnabled: toBooleanSetting(settingMap.get(notificationSettingKeys.smsEnabled), false),
    whatsappEnabled: toBooleanSetting(settingMap.get(notificationSettingKeys.whatsappEnabled), false),
  };
}

function createQueue(name: string): QueueLike {
  if (isTest) {
    return {
      add: async () => ({ mocked: true }),
    };
  }
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 1000 },
    },
  });
}

export const orderSyncQueue = createQueue('order_sync_queue');
export const tokenRefreshQueue = createQueue('token_refresh_queue');
export const labelGenerationQueue = createQueue('label_generation_queue');
export const aiProcessingQueue = createQueue('ai_processing_queue');
export const notificationQueue = createQueue('notification_queue');

function toOrderStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string') {
    return 'pending';
  }
  const normalized = value.toLowerCase();
  const statuses: OrderStatus[] = ['pending', 'accepted', 'packed', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'returned', 'rto'];
  return statuses.includes(normalized as OrderStatus) ? (normalized as OrderStatus) : 'pending';
}

function toOrderCandidate(event: { id: string; payload: Prisma.JsonValue }): MarketplaceOrderCandidate {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const fallbackId = `evt-${event.id}`;
  const platformOrderId = String(payload.orderId ?? payload.order_id ?? payload.id ?? fallbackId);
  const amount = Number(payload.orderAmount ?? payload.amount ?? 0);
  const status = toOrderStatus(payload.status);
  const orderAmount = Number.isFinite(amount) && amount > 0 ? new Prisma.Decimal(amount) : undefined;
  return { platformOrderId, status, orderAmount };
}

async function dispatchChannel(
  channel: Channel,
  user: { id: string; email: string | null; phone: string | null },
  payload: NotificationPayload,
) {
  if (channel === 'in_app') {
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        channel,
        type: payload.type,
        title: payload.title,
        message: payload.message,
      },
    });
    return;
  }

  const deliverySettings = await getNotificationDeliverySettings();
  const channelEnabled =
    (channel === 'email' && deliverySettings.emailEnabled) ||
    (channel === 'sms' && deliverySettings.smsEnabled) ||
    (channel === 'whatsapp' && deliverySettings.whatsappEnabled);
  if (!channelEnabled) {
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        channel,
        type: `${payload.type}.skipped`,
        title: payload.title,
        message: `${payload.message} (delivery skipped: ${channel} channel disabled in admin settings)`,
      },
    });
    return;
  }

  const endpoint =
    channel === 'email'
      ? deliverySettings.emailWebhookUrl
      : channel === 'sms'
        ? deliverySettings.smsWebhookUrl
        : deliverySettings.whatsappWebhookUrl;
  if (!endpoint) {
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        channel,
        type: `${payload.type}.skipped`,
        title: payload.title,
        message: `${payload.message} (delivery skipped: ${channel} webhook not configured)`,
      },
    });
    return;
  }

  const destination = channel === 'email' ? user.email : user.phone;
  if (!destination) {
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        channel,
        type: `${payload.type}.skipped`,
        title: payload.title,
        message: `${payload.message} (delivery skipped: missing recipient for ${channel})`,
      },
    });
    return;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      channel,
      destination,
      title: payload.title,
      message: payload.message,
      type: payload.type,
    }),
    signal: AbortSignal.timeout(env.NOTIFICATION_WEBHOOK_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to deliver ${channel} notification: ${response.status}`);
  }

  await prisma.notificationLog.create({
    data: {
      userId: user.id,
      channel,
      type: payload.type,
      title: payload.title,
      message: payload.message,
    },
  });
}

async function processOrderSync(job: Job<OrderSyncPayload>) {
  const data = job.data;
  const linkedAccount = await prisma.linkedAccount.findFirst({
    where: { id: data.linkedAccountId, userId: data.userId },
  });
  if (!linkedAccount) {
    throw new Error(`Linked account not found for sync job ${job.id}`);
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      userId: data.userId,
      linkedAccountId: linkedAccount.id,
      platform: linkedAccount.platform,
      status: 'processing',
      message: 'Order synchronization started',
    },
  });

  try {
    const events = await prisma.webhookEvent.findMany({
      where: { platform: linkedAccount.platform, processed: false },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    let processedCount = 0;
    for (const event of events) {
      const candidate = toOrderCandidate(event);
      const rawPayload = (event.payload ?? {}) as Prisma.InputJsonValue;
      await prisma.order.upsert({
        where: {
          platform_platformOrderId_userId: {
            platform: linkedAccount.platform,
            platformOrderId: candidate.platformOrderId,
            userId: data.userId,
          },
        },
        update: {
          status: candidate.status,
          linkedAccountId: linkedAccount.id,
          orderAmount: candidate.orderAmount,
          rawData: rawPayload,
        },
        create: {
          userId: data.userId,
          linkedAccountId: linkedAccount.id,
          platform: linkedAccount.platform,
          platformOrderId: candidate.platformOrderId,
          status: candidate.status,
          orderAmount: candidate.orderAmount,
          rawData: rawPayload,
        },
      });
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date(), error: null },
      });
      processedCount += 1;
    }

    await prisma.linkedAccount.update({
      where: { id: linkedAccount.id },
      data: {
        sessionStatus: 'active',
        lastSyncAt: new Date(),
        lastSyncSuccess: true,
        lastError: null,
      },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'success',
        message: `Order sync completed. Processed ${processedCount} order event(s).`,
        finishedAt: new Date(),
      },
    });

    return { ok: true, processedCount };
  } catch (error) {
    await prisma.linkedAccount.update({
      where: { id: linkedAccount.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncSuccess: false,
        sessionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Order sync failed',
      },
    });
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Order sync failed',
        finishedAt: new Date(),
      },
    });
    throw error;
  }
}

async function processTokenRefresh(job: Job<TokenRefreshPayload>) {
  const data = job.data;
  const account = await prisma.linkedAccount.findFirst({
    where: { id: data.linkedAccountId, userId: data.userId },
  });
  if (!account) {
    throw new Error(`Linked account not found for token refresh job ${job.id}`);
  }

  const tokenPatch: Partial<LinkedAccount> = {
    sessionStatus: 'active',
    lastError: null,
  };

  if (account.platform === 'amazon') {
    if (!account.amazonRefreshToken) {
      throw new Error('Amazon refresh token missing');
    }
    tokenPatch.amazonRefreshToken = `${account.amazonRefreshToken}:refreshed:${Date.now()}`;
  } else if (account.platform === 'flipkart') {
    if (!account.flipkartAccessToken && !account.flipkartRefreshToken) {
      throw new Error('Flipkart refresh token missing');
    }
    tokenPatch.flipkartAccessToken = `fk_access_${randomUUID()}`;
    tokenPatch.flipkartRefreshToken = `fk_refresh_${randomUUID()}`;
  } else {
    tokenPatch.sessionStatus = 'active';
  }

  await prisma.linkedAccount.update({
    where: { id: account.id },
    data: tokenPatch,
  });

  return { ok: true };
}

async function processLabelGeneration(job: Job<LabelGenerationPayload>) {
  const data = job.data;
  if (data.labelId) {
    await prisma.label.update({
      where: { id: data.labelId },
      data: {
        downloadedAt: new Date(),
      },
    });
    return { ok: true };
  }

  const order = await prisma.order.findFirst({
    where: { id: data.orderId, userId: data.userId },
  });
  if (!order) {
    throw new Error(`Order ${data.orderId} not found for label generation`);
  }

  await prisma.label.create({
    data: {
      userId: data.userId,
      orderId: order.id,
      platform: order.platform,
      labelFormat: 'a4',
      storageKey: `labels/${data.userId}/${data.orderId}.pdf`,
      downloadedAt: new Date(),
    },
  });

  return { ok: true };
}

async function processAiJob(job: Job<AiProcessingPayload>) {
  const data = job.data;
  const aiJob = await prisma.aiJob.findUnique({ where: { id: data.aiJobId } });
  if (!aiJob) {
    throw new Error(`AI job ${data.aiJobId} not found`);
  }

  await prisma.aiJob.update({
    where: { id: aiJob.id },
    data: {
      status: 'processing',
    },
  });

  await prisma.aiJob.update({
    where: { id: aiJob.id },
    data: {
      status: 'done',
      outputData: {
        provider: 'internal-default',
        completedAt: new Date().toISOString(),
        note: 'Job processed by queue worker',
      },
      completedAt: new Date(),
    },
  });

  await notificationQueue.add('dispatch-notification', {
    userId: aiJob.userId,
    type: 'ai_job_completed',
    title: 'AI job completed',
    message: `${aiJob.jobType} job is ready.`,
    channels: ['in_app', 'email'],
  } satisfies NotificationPayload);

  return { ok: true };
}

async function processNotification(job: Job<NotificationPayload>) {
  const data = job.data;
  const channels: Channel[] = data.channels?.length ? data.channels : ['in_app'];
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, email: true, phone: true },
  });
  if (!user) {
    throw new Error(`Notification user ${data.userId} not found`);
  }

  for (const channel of channels) {
    await dispatchChannel(channel, user, data);
  }

  return { ok: true };
}

function workerDefaults(): WorkerOptions {
  return {
    connection,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 1000 },
    concurrency: 5,
  };
}

function registerWorkerFailureHandler(worker: Worker, workerName: string) {
  worker.on('failed', async (job, error) => {
    try {
      await prisma.syncLog.create({
        data: {
          userId: (job?.data as { userId?: string } | undefined)?.userId,
          linkedAccountId: (job?.data as { linkedAccountId?: string } | undefined)?.linkedAccountId,
          platform: ((job?.data as { platform?: Platform } | undefined)?.platform ?? 'amazon') as Platform,
          status: 'failed',
          message: `${workerName} failed: ${error.message}`,
          finishedAt: new Date(),
        },
      });
    } catch {
      return;
    }
  });
}

export function enqueueNotificationJob(payload: NotificationPayload, options?: JobsOptions) {
  return notificationQueue.add('dispatch-notification', payload, options);
}

export function startQueueWorkers() {
  if (isTest || workersStarted) {
    return;
  }

  workersStarted = true;
  const defaults = workerDefaults();

  const orderSyncWorker = new Worker<OrderSyncPayload>('order_sync_queue', processOrderSync, defaults);
  const tokenRefreshWorker = new Worker<TokenRefreshPayload>('token_refresh_queue', processTokenRefresh, defaults);
  const labelWorker = new Worker<LabelGenerationPayload>('label_generation_queue', processLabelGeneration, defaults);
  const aiWorker = new Worker<AiProcessingPayload>('ai_processing_queue', processAiJob, defaults);
  const notificationWorker = new Worker<NotificationPayload>('notification_queue', processNotification, defaults);

  registerWorkerFailureHandler(orderSyncWorker, 'order_sync_queue');
  registerWorkerFailureHandler(tokenRefreshWorker, 'token_refresh_queue');
  registerWorkerFailureHandler(labelWorker, 'label_generation_queue');
  registerWorkerFailureHandler(aiWorker, 'ai_processing_queue');
  registerWorkerFailureHandler(notificationWorker, 'notification_queue');
}
