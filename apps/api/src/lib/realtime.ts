import type { FastifyInstance } from 'fastify';

type RealtimeEvent = 'order.update' | 'ai.completion' | 'session.warning' | 'notification.new';

export function emitToUser(
  fastify: FastifyInstance,
  userId: string,
  event: RealtimeEvent,
  payload: Record<string, unknown>,
) {
  if (!fastify.io) {
    return;
  }

  fastify.io.to(`user:${userId}`).emit(event, payload);
}
