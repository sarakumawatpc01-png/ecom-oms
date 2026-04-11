export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const payload = metadata ? ` ${JSON.stringify(metadata)}` : '';
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`[${timestamp}] [${level.toUpperCase()}] ${message}${payload}`);
}
