import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import integrationRoutes from './routes/integrations.js';
import orderRoutes from './routes/orders.js';
import webhookRoutes from './routes/webhooks.js';
import schedulerPlugin from './plugins/scheduler.js';
import { startQueueWorkers } from './queues/index.js';
import billingRoutes from './routes/billing.js';
import claimsRoutes from './routes/claims.js';
import evidenceRoutes from './routes/evidence.js';
import labelRoutes from './routes/labels.js';
import invoiceRoutes from './routes/invoices.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from './routes/notifications.js';

export function buildServer() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true, credentials: true });
  app.register(helmet);
  app.register(sensible);
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

  app.register(schedulerPlugin);
  startQueueWorkers();

  return app;
}
