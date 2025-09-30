
'use strict';
const common = require('@nestjs/common');
const core = require('@nestjs/core');
const THROTTLER_METADATA = 'nestjs_throttler:metadata';
const THROTTLER_OPTIONS = Symbol('THROTTLER_OPTIONS');
function normalizeWindow(ttl) {
  return Math.max(0, Math.floor(ttl ?? 0));
}
class ThrottlerStorageService {
  constructor() {
    this.storage = new Map();
  }
  increment(key, limit, ttl) {
    const now = Date.now();
    const windowMs = normalizeWindow(ttl) * 1000;
    const windowStart = windowMs > 0 ? now - windowMs : 0;
    const timestamps = this.storage.get(key) ?? [];
    const recent = windowMs > 0 ? timestamps.filter((time) => time >= windowStart) : timestamps.slice();
    recent.push(now);
    this.storage.set(key, recent);
    const totalHits = recent.length;
    const allowed = totalHits <= limit;
    const oldest = recent[0] ?? now;
    const expiresAt = oldest + windowMs;
    return { allowed, totalHits, expiresAt: expiresAt || now };
  }
  reset(key) {
    if (!key) {
      this.storage.clear();
      return;
    }
    this.storage.delete(key);
  }
}
common.Injectable()(ThrottlerStorageService);
function getMetadata(reflector, context) {
  if (reflector && typeof reflector.getAllAndOverride === 'function') {
    return (
      reflector.getAllAndOverride(THROTTLER_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) || null
    );
  }
  const handler = context.getHandler();
  const classRef = context.getClass();
  return (
    common.Reflector?.get?.(THROTTLER_METADATA, handler) ??
    Reflect.getMetadata?.(THROTTLER_METADATA, handler) ??
    Reflect.getMetadata?.(THROTTLER_METADATA, classRef) ??
    null
  );
}
class ThrottlerGuard {
  constructor(options, storage, reflector) {
    this.options = options ?? { ttl: 60, limit: 10 };
    this.storage = storage;
    this.reflector = reflector ?? new core.Reflector();
  }
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse?.();
    const metadata = getMetadata(this.reflector, context) || {};
    const limit = Number.isInteger(metadata.limit)
      ? metadata.limit
      : this.options.limit;
    const ttl = Number.isInteger(metadata.ttl)
      ? metadata.ttl
      : this.options.ttl;
    if (!limit || limit <= 0) {
      return true;
    }
    const ip = request?.ip || request?.ips?.[0] || request?.connection?.remoteAddress || 'unknown';
    const tracker = `${context.getClass().name}:${context.getHandler().name}:${ip}`;
    const { allowed, totalHits, expiresAt } = this.storage.increment(tracker, limit, ttl);
    const remaining = Math.max(0, limit - totalHits);
    const retryAfterSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    if (response && typeof response.setHeader === 'function') {
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      response.setHeader('X-RateLimit-Reset', Math.max(0, Math.ceil(expiresAt / 1000)));
      if (!allowed) {
        response.setHeader('Retry-After', retryAfterSeconds);
      }
    }
    if (allowed) {
      return true;
    }
    throw new common.HttpException('Too Many Requests', common.HttpStatus.TOO_MANY_REQUESTS);
  }
}
common.Injectable()(ThrottlerGuard);
Reflect.defineMetadata('design:paramtypes', [Object, ThrottlerStorageService, core.Reflector], ThrottlerGuard);
common.Inject(THROTTLER_OPTIONS)(ThrottlerGuard, undefined, 0);
common.Inject(ThrottlerStorageService)(ThrottlerGuard, undefined, 1);
common.Optional()(ThrottlerGuard, undefined, 2);
common.Inject(core.Reflector)(ThrottlerGuard, undefined, 2);
function Throttle(limit, ttl) {
  const normalizedLimit = Math.max(0, Math.floor(limit));
  const normalizedTtl = ttl === undefined ? undefined : Math.max(0, Math.floor(ttl));
  return (target, key, descriptor) => {
    const metadata = { limit: normalizedLimit, ttl: normalizedTtl };
    if (descriptor) {
      Reflect.defineMetadata(THROTTLER_METADATA, metadata, descriptor.value);
    } else {
      Reflect.defineMetadata(THROTTLER_METADATA, metadata, target);
    }
    return descriptor;
  };
}
class ThrottlerModule {}
ThrottlerModule.forRoot = function forRoot(options) {
  const normalized = {
    ttl: Math.max(1, Math.floor(options?.ttl ?? 60)),
    limit: Math.max(1, Math.floor(options?.limit ?? 10)),
  };
  const optionsProvider = { provide: THROTTLER_OPTIONS, useValue: normalized };
  return {
    module: ThrottlerModule,
    providers: [optionsProvider, ThrottlerStorageService],
    exports: [ThrottlerStorageService, optionsProvider.provide],
  };
};
common.Module({})(ThrottlerModule);
module.exports = {
  ThrottlerModule,
  ThrottlerGuard,
  ThrottlerStorageService,
  Throttle,
  THROTTLER_OPTIONS,
  THROTTLER_METADATA,
};