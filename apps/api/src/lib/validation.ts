import { z } from 'zod';

export const platformSchema = z.enum(['amazon', 'flipkart', 'meesho']);
export const nullableStringSchema = z.string().trim().optional();
export const uuidSchema = z.string().uuid();

export const idParamSchema = z.object({ id: uuidSchema });
export const orderIdParamSchema = z.object({ orderId: uuidSchema });
export const platformParamSchema = z.object({ platform: platformSchema });
