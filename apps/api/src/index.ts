import { env } from './config/env';
import { buildServer } from './server';
import { createSocketServer } from './lib/socket';

async function start() {
  const app = buildServer();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.io = createSocketServer(app.server);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
