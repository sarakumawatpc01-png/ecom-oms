import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';

const connection = redis;

export const orderSyncQueue = new Queue('order_sync_queue', { connection });
export const tokenRefreshQueue = new Queue('token_refresh_queue', { connection });
export const labelGenerationQueue = new Queue('label_generation_queue', { connection });
export const aiProcessingQueue = new Queue('ai_processing_queue', { connection });
export const notificationQueue = new Queue('notification_queue', { connection });

export function startQueueWorkers() {
  const defaults = { connection, removeOnComplete: { count: 1000 }, removeOnFail: { count: 1000 } };

  new Worker('order_sync_queue', async () => ({ ok: true }), defaults);
  new Worker('token_refresh_queue', async () => ({ ok: true }), defaults);
  new Worker('label_generation_queue', async () => ({ ok: true }), defaults);
  new Worker('ai_processing_queue', async () => ({ ok: true }), defaults);
  new Worker('notification_queue', async () => ({ ok: true }), defaults);
}
