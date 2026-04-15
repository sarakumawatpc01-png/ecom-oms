const SENSITIVE_KEYS = new Set(['passwordHash', 'clientSecretEnc']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

export function sanitizeResponse<T>(payload: T): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeResponse(item)) as T;
  }
  if (!isPlainObject(payload)) {
    return payload;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key)) {
      continue;
    }
    sanitized[key] = sanitizeResponse(value);
  }
  return sanitized as T;
}

export function serializeOrderWithDetails<T extends { rawData?: unknown }>(order: T): Omit<T, 'rawData'> & { details: { rawData: unknown | null } } {
  const { rawData, ...rest } = order as T & { rawData?: unknown };
  return {
    ...rest,
    details: { rawData: rawData ?? null },
  };
}
