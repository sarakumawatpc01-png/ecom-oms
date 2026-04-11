import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';

const connection = redis;
const isTest = process.env.NODE_ENV === 'test';

function createQueue(name: string): any {
  if (isTest) {
    return {
      add: async () => ({ mocked: true }),
    };
  }
  return new Queue(name, { connection });
}

export const orderSyncQueue = createQueue('order_sync_queue');
export const tokenRefreshQueue = createQueue('token_refresh_queue');
export const labelGenerationQueue = createQueue('label_generation_queue');
export const aiProcessingQueue = createQueue('ai_processing_queue');
export const notificationQueue = createQueue('notification_queue');

export function startQueueWorkers() {
  if (isTest) {
    return;
  }

  const defaults = { connection, removeOnComplete: { count: 1000 }, removeOnFail: { count: 1000 } };

  new Worker('order_sync_queue', async () => ({ ok: true }), defaults);
  new Worker('token_refresh_queue', async () => ({ ok: true }), defaults);
  new Worker('label_generation_queue', async () => ({ ok: true }), defaults);
  new Worker('ai_processing_queue', async () => ({ ok: true }), defaults);
  new Worker('notification_queue', async () => ({ ok: true }), defaults);
}
