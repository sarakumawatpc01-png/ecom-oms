import crypto from 'crypto';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

const OTP_EXPIRY_SETTING_KEY = 'auth.otp.expiryMinutes';
const OTP_EXPIRY_MINUTES_DEFAULT = 10;
const OTP_EXPIRY_MINUTES_MIN = 1;
const OTP_EXPIRY_MINUTES_MAX = 30;

async function getOtpExpirySeconds() {
  const configured = await prisma.siteSetting.findUnique({
    where: { key: OTP_EXPIRY_SETTING_KEY },
    select: { value: true },
  });

  const parsed = Number.parseInt(configured?.value ?? '', 10);
  if (!Number.isInteger(parsed) || parsed < OTP_EXPIRY_MINUTES_MIN || parsed > OTP_EXPIRY_MINUTES_MAX) {
    return OTP_EXPIRY_MINUTES_DEFAULT * 60;
  }

  return parsed * 60;
}

export async function createOtp(email: string) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresInSeconds = await getOtpExpirySeconds();
  await redis.set(`otp:${email}`, otp, 'EX', expiresInSeconds);
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
