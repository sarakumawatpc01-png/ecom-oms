import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
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

export function buildServer(options?: { withBackgroundJobs?: boolean }) {
  const withBackgroundJobs = options?.withBackgroundJobs ?? true;
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true, credentials: true });
  app.register(helmet);
  app.register(sensible);
  app.register(rateLimit, { global: false });
  app.register(jwt, { secret: env.JWT_ACCESS_SECRET });

  app.addHook('onResponse', async (request, reply) => {
    app.log.info({ method: request.method, url: request.url, statusCode: reply.statusCode }, 'request.completed');
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

  if (withBackgroundJobs) {
    app.register(schedulerPlugin);
    startQueueWorkers();
  }

  return app;
}
