import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export async function createAdminAuditLog(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await prisma.adminActivityLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details as Prisma.InputJsonValue | undefined,
      ipAddress: params.ipAddress,
    },
  });
}
