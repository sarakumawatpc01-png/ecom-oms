import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { ZodError } from 'zod';
import { env } from './config/env';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import integrationRoutes from './routes/integrations';
import orderRoutes from './routes/orders';
import webhookRoutes from './routes/webhooks';
import schedulerPlugin from './plugins/scheduler';
import { startQueueWorkers } from './queues/index';
import billingRoutes from './routes/billing';
import claimsRoutes from './routes/claims';
import evidenceRoutes from './routes/evidence';
import labelRoutes from './routes/labels';
import invoiceRoutes from './routes/invoices';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';
import reportsRoutes from './routes/reports';
import teamRoutes from './routes/team';
import siteSettingsRoutes from './routes/site-settings';
import { prisma } from './lib/prisma';

const MAX_JWT_TOKEN_LENGTH = 2048;

export function buildServer(options?: { withBackgroundJobs?: boolean }) {
  const withBackgroundJobs = options?.withBackgroundJobs ?? true;
  const app = Fastify({ logger: true });
  app.decorate('io', undefined);

  app.register(cors, { origin: true, credentials: true });
  app.register(helmet);
  app.register(sensible);
  app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
  app.register(rateLimit, {
    global: true,
    max: 1000,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      const authorization = request.headers.authorization;
      if (authorization?.startsWith('Bearer ')) {
        const token = authorization.slice('Bearer '.length);
        if (token.length > MAX_JWT_TOKEN_LENGTH) {
          return `ip:${request.ip}`;
        }
        let dotCount = 0;
        for (const char of token) {
          if (char === '.') {
            dotCount += 1;
            if (dotCount > 2) {
              break;
            }
          }
        }
        if (dotCount !== 2) {
          return `ip:${request.ip}`;
        }
        try {
          const payload = app.jwt.verify<{ userId?: string }>(token);
          if (payload?.userId) {
            return `user:${payload.userId}`;
          }
        } catch {
          // fall back to IP for invalid/expired/missing token
        }
      }
      return `ip:${request.ip}`;
    },
  });

  app.addHook('onResponse', async (request, reply) => {
    app.log.info({ method: request.method, url: request.url, statusCode: reply.statusCode }, 'request.completed');
    if (!env.ENABLE_API_LOG_PERSISTENCE) {
      return;
    }
    try {
      await prisma.apiLog.create({
        data: {
          userId: request.userContext?.userId,
          method: request.method,
          path: request.url,
          statusCode: reply.statusCode,
          latencyMs: Math.max(0, Math.round(reply.elapsedTime)),
          payload: request.body as object | undefined,
        },
      });
    } catch (error) {
      app.log.warn({ err: error, path: request.url }, 'api_log.persist_failed');
    }
  });

  app.register(healthRoutes, { prefix: '/health' });
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(adminRoutes, { prefix: '/api/admin' });
  app.register(integrationRoutes, { prefix: '/api/integrations' });
  app.register(orderRoutes, { prefix: '/api/orders' });
  app.register(webhookRoutes, { prefix: '/api/webhooks' });
  app.register(billingRoutes, { prefix: '/api/billing' });
  app.register(claimsRoutes, { prefix: '/api/claims' });
  app.register(evidenceRoutes, { prefix: '/api/evidence' });
  app.register(labelRoutes, { prefix: '/api/labels' });
  app.register(invoiceRoutes, { prefix: '/api/invoices' });
  app.register(aiRoutes, { prefix: '/api/ai' });
  app.register(notificationRoutes, { prefix: '/api/notifications' });
  app.register(reportsRoutes, { prefix: '/api/reports' });
  app.register(teamRoutes, { prefix: '/api/team' });
  app.register(siteSettingsRoutes, { prefix: '/api/site-settings' });

  if (withBackgroundJobs) {
    app.register(schedulerPlugin);
    startQueueWorkers();
  }

  app.setErrorHandler((error, request, reply) => {
    const err = error as { stack?: string; message?: string; statusCode?: number };
    request.log.error({ err: error, stack: err.stack }, 'request.failed');

    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: 'Invalid request payload',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    if (typeof err.statusCode === 'number' && err.statusCode < 500) {
      return reply.code(err.statusCode).send({
        message: err.message ?? 'Request failed',
      });
    }

    return reply.code(500).send({ message: 'Internal Server Error' });
  });

  return app;
}
