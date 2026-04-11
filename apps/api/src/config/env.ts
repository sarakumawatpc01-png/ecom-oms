import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../../.env' });

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/agencyfic_oms'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().default('dev_access_secret_please_override'),
  JWT_REFRESH_SECRET: z.string().default('dev_refresh_secret_please_override'),
  ENCRYPTION_KEY_HEX: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
});

export const env = envSchema.parse(process.env);
