import jwt from 'jsonwebtoken';

const linkedAccountFindManyMock = jest.fn();
const notificationCreateMock = jest.fn();
const orderSyncAddMock = jest.fn();
const emitToUserMock = jest.fn();

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    linkedAccount: {
      findMany: linkedAccountFindManyMock,
    },
    notificationLog: {
      create: notificationCreateMock,
    },
    apiLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../src/queues/index', () => ({
  orderSyncQueue: {
    add: orderSyncAddMock,
  },
  enqueueNotificationJob: jest.fn().mockResolvedValue({ queued: true }),
  startQueueWorkers: jest.fn(),
}));

jest.mock('../src/lib/realtime', () => ({
  emitToUser: emitToUserMock,
}));

import { buildServer } from '../src/server';

describe('order sync queueing', () => {
  it('queues sync jobs for enabled linked accounts', async () => {
    linkedAccountFindManyMock.mockResolvedValueOnce([
      { id: 'account-1', platform: 'amazon' },
      { id: 'account-2', platform: 'flipkart' },
    ]);
    notificationCreateMock.mockResolvedValueOnce({
      id: 'notif-1',
      title: 'Order sync started',
      message: 'Queued sync for 2 linked account(s).',
      sentAt: new Date(),
    });
    orderSyncAddMock.mockResolvedValue({ id: 'job-1' });

    const app = buildServer({ withBackgroundJobs: false });
    const token = jwt.sign({ userId: 'user-1', role: 'seller' }, 'dev_access_secret_please_override');
    const response = await app.inject({
      method: 'POST',
      url: '/api/orders/sync',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ queued: 2 });
    expect(orderSyncAddMock).toHaveBeenCalledTimes(2);
    expect(emitToUserMock).toHaveBeenCalled();

    await app.close();
  });
});
