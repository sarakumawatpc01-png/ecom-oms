import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const reportsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/sales-summary', { preHandler: [requireAuth] }, async (request) => {
    const userId = request.userContext!.userId;
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { id: true, status: true, platform: true, orderAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalOrders = orders.length;
    const totalRevenueInr = orders.reduce((sum, order) => sum + Number(order.orderAmount ?? 0), 0);
    const statusBreakdown = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});
    const platformBreakdown = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.platform] = (acc[order.platform] ?? 0) + 1;
      return acc;
    }, {});

    return { totalOrders, totalRevenueInr, statusBreakdown, platformBreakdown };
  });

  fastify.get('/returns-analysis', { preHandler: [requireAuth] }, async (request) => {
    const userId = request.userContext!.userId;
    const returns = await prisma.return.findMany({
      where: { userId },
      select: { id: true, platform: true, claimStatus: true, amountRecovered: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalReturns = returns.length;
    const recoveredAmountInr = returns.reduce((sum, item) => sum + Number(item.amountRecovered ?? 0), 0);
    const byClaimStatus = returns.reduce<Record<string, number>>((acc, item) => {
      acc[item.claimStatus] = (acc[item.claimStatus] ?? 0) + 1;
      return acc;
    }, {});
    const byPlatform = returns.reduce<Record<string, number>>((acc, item) => {
      acc[item.platform] = (acc[item.platform] ?? 0) + 1;
      return acc;
    }, {});

    return { totalReturns, recoveredAmountInr, byClaimStatus, byPlatform };
  });

  fastify.get('/platform-performance', { preHandler: [requireAuth] }, async (request) => {
    const userId = request.userContext!.userId;
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { platform: true, status: true },
    });

    const performance = orders.reduce<Record<string, { total: number; delivered: number; returned: number; cancelled: number }>>((acc, order) => {
      const current = acc[order.platform] ?? { total: 0, delivered: 0, returned: 0, cancelled: 0 };
      current.total += 1;
      if (order.status === 'delivered') {
        current.delivered += 1;
      }
      if (order.status === 'returned' || order.status === 'rto') {
        current.returned += 1;
      }
      if (order.status === 'cancelled') {
        current.cancelled += 1;
      }
      acc[order.platform] = current;
      return acc;
    }, {});

    return { performance };
  });

  fastify.get('/export/orders.csv', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userContext!.userId;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        id: true,
        platform: true,
        platformOrderId: true,
        status: true,
        orderAmount: true,
        customerName: true,
        createdAt: true,
      },
    });

    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ['id', 'platform', 'platformOrderId', 'status', 'orderAmount', 'customerName', 'createdAt'].join(','),
      ...orders.map((order) =>
        [
          escape(order.id),
          escape(order.platform),
          escape(order.platformOrderId),
          escape(order.status),
          escape(String(order.orderAmount ?? '')),
          escape(order.customerName ?? ''),
          escape(order.createdAt.toISOString()),
        ].join(','),
      ),
    ];

    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header('content-disposition', 'attachment; filename="orders-report.csv"');
    return rows.join('\n');
  });

  fastify.get('/export/orders.xlsx', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userContext!.userId;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        id: true,
        platform: true,
        platformOrderId: true,
        status: true,
        orderAmount: true,
        customerName: true,
        createdAt: true,
      },
    });

    const escapeCell = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const tableRows = [
      ['id', 'platform', 'platformOrderId', 'status', 'orderAmount', 'customerName', 'createdAt'],
      ...orders.map((order) => [
        order.id,
        order.platform,
        order.platformOrderId,
        order.status,
        String(order.orderAmount ?? ''),
        order.customerName ?? '',
        order.createdAt.toISOString(),
      ]),
    ]
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`)
      .join('');

    const htmlWorkbook = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body><table>${tableRows}</table></body>
</html>`;

    reply.header('content-type', 'application/vnd.ms-excel; charset=utf-8');
    reply.header('content-disposition', 'attachment; filename="orders-report.xlsx"');
    return htmlWorkbook;
  });
};

export default reportsRoutes;
