process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.APP_PORT = process.env.APP_PORT ?? '4000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/testdb';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'http://localhost:9000';
process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'test-access';
process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'test-secret';
process.env.FEATURE_FLAG_CACHE_TTL_SECONDS =
  process.env.FEATURE_FLAG_CACHE_TTL_SECONDS ?? '60';
process.env.JWT_ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_TOKEN_SECRET ?? 'access-secret';
process.env.JWT_ACCESS_TOKEN_TTL_SECONDS =
  process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? '900';
process.env.JWT_REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_TOKEN_SECRET ?? 'refresh-secret';
process.env.JWT_REFRESH_TOKEN_TTL_SECONDS =
  process.env.JWT_REFRESH_TOKEN_TTL_SECONDS ?? String(60 * 60 * 24 * 7);
