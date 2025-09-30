'use strict';

require('reflect-metadata');

const {
  Inject,
  Injectable,
  Module,
  Global,
  SetMetadata,
  HttpException,
  HttpStatus,
} = require('@nestjs/common');

const THROTTLER_OPTIONS = Symbol.for('nestjs.throttler.options');
const THROTTLER_METADATA = 'nestjs:throttler';
const DEFAULT_OPTIONS = { ttl: 60, limit: 60 };

const Throttle = (limit, ttl) =>
  SetMetadata(THROTTLER_METADATA, { limit, ttl });

class ThrottlerStorageService {
  constructor() {
    this.storage = new Map();
  }

  increment(key, limit, ttl) {
    const now = Date.now();
    let record = this.storage.get(key);
    if (!record || record.expiresAt <= now) {
      record = {
        totalHits: 1,
        expiresAt: now + ttl * 1000,
      };
      this.storage.set(key, record);
      return { allowed: true, totalHits: 1, expiresAt: record.expiresAt };
    }

    record.totalHits += 1;
    return {
      allowed: record.totalHits <= limit,
      totalHits: record.totalHits,
      expiresAt: record.expiresAt,
    };
  }

  reset(key) {
    if (key) {
      this.storage.delete(key);
      return;
    }
    this.storage.clear();
  }
}
Injectable()(ThrottlerStorageService);

const throttlerStorageSingleton = new ThrottlerStorageService();

class ThrottlerGuard {
  constructor(options, storage) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options || {});
    this.storage = storage ?? throttlerStorageSingleton;
  }

  getThrottleMetadata(target) {
    if (!target || typeof Reflect?.getMetadata !== 'function') {
      return undefined;
    }
    return Reflect.getMetadata(THROTTLER_METADATA, target);
  }

  getTracker(request) {
    if (!request) {
      return 'anonymous';
    }
    const forwarded = request.headers?.['x-forwarded-for'];
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.headers?.['x-real-ip'] ||
      'anonymous'
    );
  }

  getRouteKey(context, request) {
    const handler = context.getHandler?.();
    const classRef = context.getClass?.();
    const controllerName = classRef?.name ?? 'anonymous-controller';
    const handlerName = handler?.name ?? request?.route?.path ?? request?.url ?? 'anonymous';
    return `${controllerName}:${handlerName}`;
  }

  async canActivate(context) {
    if (context.getType && context.getType() !== 'http') {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse?.();

    const handlerMetadata = this.getThrottleMetadata(context.getHandler?.());
    const classMetadata = this.getThrottleMetadata(context.getClass?.());
    const metadata = handlerMetadata ?? classMetadata ?? {};

    const limit = Number.isFinite(metadata.limit)
      ? Number(metadata.limit)
      : Number(this.options.limit ?? DEFAULT_OPTIONS.limit);
    const ttl = Number.isFinite(metadata.ttl)
      ? Number(metadata.ttl)
      : Number(this.options.ttl ?? DEFAULT_OPTIONS.ttl);

    if (!Number.isFinite(limit) || limit <= 0) {
      return true;
    }

    const tracker = this.getTracker(request);
    const key = `${this.getRouteKey(context, request)}:${tracker}`;
    const record = this.storage.increment(key, limit, ttl);
    const remaining = Math.max(limit - record.totalHits, 0);
    const resetAtSeconds = Math.ceil(record.expiresAt / 1000);
    const retryAfterSeconds = Math.max(
      Math.ceil((record.expiresAt - Date.now()) / 1000),
      0,
    );

    if (response && typeof response.setHeader === 'function') {
      response.setHeader('X-RateLimit-Limit', String(limit));
      response.setHeader('X-RateLimit-Remaining', String(remaining));
      response.setHeader('X-RateLimit-Reset', String(resetAtSeconds));
    }

    if (!record.allowed) {
      if (response && typeof response.setHeader === 'function') {
        response.setHeader('Retry-After', String(retryAfterSeconds));
      }
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
Injectable()(ThrottlerGuard);
Inject(THROTTLER_OPTIONS)(ThrottlerGuard, 0);
Inject(ThrottlerStorageService)(ThrottlerGuard, 1);

class ThrottlerModuleClass {}
Module({})(ThrottlerModuleClass);
Global()(ThrottlerModuleClass);

ThrottlerModuleClass.forRoot = function forRoot(options) {
  return {
    module: ThrottlerModuleClass,
    providers: [
      {
        provide: THROTTLER_OPTIONS,
        useValue: Object.assign({}, DEFAULT_OPTIONS, options || {}),
      },
      {
        provide: ThrottlerStorageService,
        useValue: throttlerStorageSingleton,
      },
    ],
    exports: [THROTTLER_OPTIONS, ThrottlerStorageService],
  };
};

module.exports = {
  THROTTLER_OPTIONS,
  THROTTLER_METADATA,
  ThrottlerModule: ThrottlerModuleClass,
  Throttle,
  ThrottlerGuard,
  ThrottlerStorageService,
};
