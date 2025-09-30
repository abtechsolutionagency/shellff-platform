import { DynamicModule, ExecutionContext } from '@nestjs/common';
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';

export interface ThrottlerModuleOptions {
  ttl: number;
  limit: number;
}

export interface ThrottleOptions {
  limit: number;
  ttl?: number;
}

export declare const THROTTLER_OPTIONS: unique symbol;
export declare const THROTTLER_METADATA: string;

export declare class ThrottlerStorageService {
  reset(key?: string): void;
  increment(
    key: string,
    limit: number,
    ttl: number,
  ): { allowed: boolean; totalHits: number; expiresAt: number };
}

export declare const Throttle: (
  limit: number,
  ttl?: number,
) => ClassDecorator & MethodDecorator;

export declare class ThrottlerGuard implements CanActivate {
  constructor(...args: any[]);
  canActivate(context: ExecutionContext): Promise<boolean>;
}

export declare class ThrottlerModule {
  static forRoot(options: ThrottlerModuleOptions): DynamicModule;
}
