import crypto from 'crypto';
import { redis } from '../lib/redis';

export async function createOtp(email: string) {
  const bytes = crypto.randomBytes(4).readUInt32BE(0);
  const otp = (bytes % 900000 + 100000).toString();
  await redis.set(`otp:${email}`, otp, 'EX', 600);
  return otp;
}

export async function verifyOtp(email: string, code: string) {
  const saved = await redis.get(`otp:${email}`);
  if (!saved || saved !== code) {
    return false;
  }
  await redis.del(`otp:${email}`);
  return true;
}
