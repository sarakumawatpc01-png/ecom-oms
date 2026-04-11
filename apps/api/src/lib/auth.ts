import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(fastify: FastifyInstance, payload: { userId: string; role: string }) {
  return fastify.jwt.sign(payload, { expiresIn: '15m' });
}

export function signRefreshToken(fastify: FastifyInstance, payload: { userId: string; role: string }) {
  return fastify.jwt.sign(payload, { expiresIn: '30d' });
}
