import { randomUUID } from 'crypto';
import { z } from 'zod';
import { addDays } from '../services/date';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { comparePassword, hashPassword, signAccessToken, signRefreshToken } from '../lib/auth';
import { createOtp, verifyOtp } from '../services/otp';
import { requireAuth } from '../middleware/auth';

const registerBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
  role: z.enum(['seller', 'sub_user']).optional(),
});

const verifyOtpBodySchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().min(1),
});

const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  trustDevice: z.boolean().optional(),
  deviceName: z.string().trim().optional(),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const OTP_VERIFY_MAX_ATTEMPTS = 5;
  const OTP_VERIFY_WINDOW_SECONDS = 60;
  const ipBasedLimiter = fastify.rateLimit({ max: OTP_VERIFY_MAX_ATTEMPTS, timeWindow: '1 minute', keyGenerator: (request) => request.ip });
  const otpVerifyRateLimitConfig = {
    max: OTP_VERIFY_MAX_ATTEMPTS,
    timeWindow: '1 minute',
    keyGenerator: (request: { ip: string }) => request.ip,
  };
  const otpVerifyIpLimiter = fastify.rateLimit(otpVerifyRateLimitConfig);

  fastify.post('/register', { preHandler: [ipBasedLimiter] }, async (request, reply) => {
    const body = registerBodySchema.parse(request.body);
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ message: 'Email already in use' });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: body.name,
        role: body.role ?? 'seller',
      },
    });

    await createOtp(user.email);
    return reply.code(201).send({ userId: user.id, message: 'Registered. Verify OTP sent to your email.' });
  });

  fastify.post(
    '/verify-otp',
    {
      config: {
        rateLimit: otpVerifyRateLimitConfig,
      },
      onRequest: [otpVerifyIpLimiter],
    },
    async (request, reply) => {
      const parsedBody = verifyOtpBodySchema.parse(request.body);
      const email = parsedBody.email.toLowerCase();
      const key = `ratelimit:verify-otp:${request.ip}:${email}`;
      const attempts = await redis.incr(key);
      if (attempts === 1) {
        await redis.expire(key, OTP_VERIFY_WINDOW_SECONDS);
      }
      if (attempts > OTP_VERIFY_MAX_ATTEMPTS) {
        return reply.code(429).send({ message: 'Too many OTP verification attempts. Try again later.' });
      }

      const ok = await verifyOtp(email, parsedBody.otp);
      if (!ok) {
        return reply.code(400).send({ message: 'Invalid OTP' });
      }

      await prisma.user.update({ where: { email }, data: { isVerified: true } });
      return reply.send({ verified: true });
    },
  );

  fastify.post('/login', { preHandler: [fastify.rateLimit({ max: 10, timeWindow: '1 minute' })] }, async (request, reply) => {
    const body = loginBodySchema.parse(request.body);
    const email = body.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

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
    const user = await prisma.user.findUnique({
      where: { id: request.userContext!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        businessName: true,
        gstin: true,
        pan: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        planId: true,
        creditsPurchased: true,
        creditsUsed: true,
        creditsGraceUsed: true,
        planExpiresAt: true,
        isActive: true,
        isVerified: true,
        role: true,
        parentUserId: true,
        subUserRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { user };
  });
};

export default authRoutes;
