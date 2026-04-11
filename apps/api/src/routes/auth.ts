import { randomUUID } from 'crypto';
import { addDays } from '../services/date';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { comparePassword, hashPassword, signAccessToken, signRefreshToken } from '../lib/auth';
import { createOtp, verifyOtp } from '../services/otp';
import { requireAuth } from '../middleware/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = request.body as { email: string; password: string; name: string; role?: 'seller' | 'sub_user' };

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.code(409).send({ message: 'Email already in use' });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role ?? 'seller',
      },
    });

    await createOtp(user.email);
    return reply.code(201).send({ userId: user.id, message: 'Registered. Verify OTP sent to your email.' });
  });

  fastify.post('/verify-otp', async (request, reply) => {
    const body = request.body as { email: string; otp: string };
    const ok = await verifyOtp(body.email, body.otp);
    if (!ok) {
      return reply.code(400).send({ message: 'Invalid OTP' });
    }

    await prisma.user.update({ where: { email: body.email }, data: { isVerified: true } });
    return reply.send({ verified: true });
  });

  fastify.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = request.body as { email: string; password: string; trustDevice?: boolean; deviceName?: string };
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const ok = await comparePassword(body.password, user.passwordHash);
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        deviceHint: body.deviceName,
        success: ok,
        failureReason: ok ? undefined : 'invalid_credentials',
      },
    });

    if (!ok) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(fastify, { userId: user.id, role: user.role });
    const refreshToken = signRefreshToken(fastify, { userId: user.id, role: user.role });

    if (body.trustDevice) {
      await prisma.trustedDevice.create({
        data: {
          userId: user.id,
          deviceName: body.deviceName ?? 'Unknown Device',
          trustToken: randomUUID(),
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          expiresAt: addDays(new Date(), 30),
          lastUsedAt: new Date(),
        },
      });
    }

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  });

  fastify.post('/logout', { preHandler: [requireAuth] }, async () => {
    return { ok: true };
  });

  fastify.get('/me', { preHandler: [requireAuth] }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.userContext!.userId } });
    return { user };
  });
};

export default authRoutes;
