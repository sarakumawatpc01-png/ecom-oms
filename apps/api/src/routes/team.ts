import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { hashPassword } from '../lib/auth';
import { idParamSchema } from '../lib/validation';

const inviteBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['admin', 'order_manager', 'view_only']).optional(),
});

const updateSubUserBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  subUserRole: z.enum(['admin', 'order_manager', 'view_only']).optional(),
});

const teamRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireAuth] }, async (request) => {
    const subUsers = await prisma.user.findMany({
      where: { parentUserId: request.userContext!.userId, role: 'sub_user' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        subUserRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { subUsers };
  });

  fastify.post('/invite', { preHandler: [requireAuth] }, async (request, reply) => {
    const body = inviteBodySchema.parse(request.body);
    const role = body.role ?? 'view_only';
    const email = body.email;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ message: 'Email already in use' });
    }

    const tempPassword = `Temp@${randomBytes(6).toString('base64url')}!`;
    const user = await prisma.user.create({
      data: {
        parentUserId: request.userContext!.userId,
        role: 'sub_user',
        subUserRole: role,
        name: body.name,
        email,
        passwordHash: await hashPassword(tempPassword),
        isVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        subUserRole: true,
        isActive: true,
      },
    });

    return reply.code(201).send({
      invited: true,
      subUser: user,
      onboarding: {
        tempPassword,
        message: 'Share this temporary password securely and ask the team member to reset it after first login.',
      },
    });
  });

  fastify.patch('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const body = updateSubUserBodySchema.parse(request.body);

    const subUser = await prisma.user.findFirst({
      where: { id: params.id, parentUserId: request.userContext!.userId, role: 'sub_user' },
    });
    if (!subUser) {
      return reply.code(404).send({ message: 'Sub-user not found' });
    }

    const updated = await prisma.user.update({
      where: { id: subUser.id },
      data: {
        name: body.name,
        isActive: body.isActive,
        subUserRole: body.subUserRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        subUserRole: true,
        updatedAt: true,
      },
    });

    return { subUser: updated };
  });
};

export default teamRoutes;
