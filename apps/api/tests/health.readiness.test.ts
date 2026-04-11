const queryRawMock = jest.fn();
const redisPingMock = jest.fn();

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

jest.mock('../src/lib/redis', () => ({
  redis: {
    ping: redisPingMock,
  },
}));

import { buildServer } from '../src/server';

describe('health readiness route', () => {
  it('returns ready when db and redis checks pass', async () => {
    queryRawMock.mockResolvedValueOnce([{ '?column?': 1 }]);
    redisPingMock.mockResolvedValueOnce('PONG');

    const app = buildServer({ withBackgroundJobs: false });
    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ready',
      checks: { database: true, redis: true },
    });

    await app.close();
  });

  it('returns degraded when dependencies are unavailable', async () => {
    queryRawMock.mockRejectedValueOnce(new Error('db down'));
    redisPingMock.mockRejectedValueOnce(new Error('redis down'));

    const app = buildServer({ withBackgroundJobs: false });
    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      status: 'degraded',
      checks: { database: false, redis: false },
    });

    await app.close();
  });
});
