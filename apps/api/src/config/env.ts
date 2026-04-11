import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../../.env' });

dotenv.config();

const DEFAULT_ACCESS_SECRET = 'dev_access_secret_please_override';
const DEFAULT_REFRESH_SECRET = 'dev_refresh_secret_please_override';
const DEFAULT_ENCRYPTION_KEY_HEX = '8fbbd14731f46b5bc694264f6fdb8ee4d8d71709a4e547ab37e2248f8d985f5f';
// Allow empty env values for optional webhook URLs by coercing blank strings to undefined before URL validation.
const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/agencyfic_oms'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().default(DEFAULT_ACCESS_SECRET),
  JWT_REFRESH_SECRET: z.string().default(DEFAULT_REFRESH_SECRET),
  ENCRYPTION_KEY_HEX: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/)
    .default(DEFAULT_ENCRYPTION_KEY_HEX),
  EMAIL_WEBHOOK_URL: optionalUrl,
  SMS_WEBHOOK_URL: optionalUrl,
  WHATSAPP_WEBHOOK_URL: optionalUrl,
  NOTIFICATION_WEBHOOK_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  ENABLE_API_LOG_PERSISTENCE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
});

export const env = envSchema.parse(process.env);

if (env.NODE_ENV === 'production' && env.ENCRYPTION_KEY_HEX === DEFAULT_ENCRYPTION_KEY_HEX) {
  throw new Error('ENCRYPTION_KEY_HEX must be explicitly set in production.');
}

if (env.NODE_ENV === 'production' && env.JWT_ACCESS_SECRET === DEFAULT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET must be explicitly set in production.');
}

if (env.NODE_ENV === 'production' && env.JWT_REFRESH_SECRET === DEFAULT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET must be explicitly set in production.');
}
