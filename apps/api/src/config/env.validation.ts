export type EnvConfig = {
  NODE_ENV: 'development' | 'test' | 'production';
  APP_PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  MINIO_ENDPOINT: string;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  FEATURE_FLAG_CACHE_TTL_SECONDS: number;
};

const NODE_ENVS = new Set(['development', 'test', 'production']);

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return undefined;
}

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const errors: string[] = [];

  const rawNodeEnv = asString(config.NODE_ENV) ?? 'development';
  const NODE_ENV = NODE_ENVS.has(rawNodeEnv) ? (rawNodeEnv as EnvConfig['NODE_ENV']) : undefined;
  if (!NODE_ENV) {
    errors.push(`NODE_ENV must be one of: ${Array.from(NODE_ENVS).join(', ')}`);
  }

  const APP_PORT = asNumber(config.APP_PORT) ?? 3000;
  if (!Number.isInteger(APP_PORT) || APP_PORT <= 0) {
    errors.push('APP_PORT must be a positive integer');
  }

  const DATABASE_URL = asString(config.DATABASE_URL);
  if (!DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  } else if (!DATABASE_URL.startsWith('postgres://') && !DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must point to a Postgres instance');
  }

  const REDIS_URL = asString(config.REDIS_URL) ?? 'redis://localhost:6379';
  const MINIO_ENDPOINT = asString(config.MINIO_ENDPOINT) ?? 'http://localhost:9000';
  const MINIO_ACCESS_KEY = asString(config.MINIO_ACCESS_KEY) ?? 'shellff';
  const MINIO_SECRET_KEY = asString(config.MINIO_SECRET_KEY) ?? 'shellffsecret';
  const FEATURE_FLAG_CACHE_TTL_SECONDS = asNumber(config.FEATURE_FLAG_CACHE_TTL_SECONDS) ?? 60;

  if (FEATURE_FLAG_CACHE_TTL_SECONDS <= 0) {
    errors.push('FEATURE_FLAG_CACHE_TTL_SECONDS must be a positive integer');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return {
    NODE_ENV: NODE_ENV ?? 'development',
    APP_PORT,
    DATABASE_URL: DATABASE_URL!,
    REDIS_URL,
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    FEATURE_FLAG_CACHE_TTL_SECONDS,
  };
}
