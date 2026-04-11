import { env } from './config/env';
import { buildServer } from './server';

async function start() {
  const app = buildServer();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
