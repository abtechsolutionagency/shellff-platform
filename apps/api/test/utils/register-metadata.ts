import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { AuditController } from '../../src/audit/audit.controller';
import { AuditService } from '../../src/audit/audit.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { OtpService } from '../../src/auth/otp.service';
import { RolesGuard } from '../../src/auth/roles.guard';
import { TokenService } from '../../src/auth/token.service';
import { FeatureFlagsController } from '../../src/feature-flags/feature-flags.controller';
import { FeatureFlagsService } from '../../src/feature-flags/feature-flags.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RolesController } from '../../src/roles/roles.controller';
import { RolesService } from '../../src/roles/roles.service';
import { TelemetryController } from '../../src/telemetry/telemetry.controller';
import { RateLimitMonitorService } from '../../src/telemetry/rate-limit-monitor.service';
import { TelemetryService } from '../../src/telemetry/telemetry.service';

function ensureMetadata(target: Function, dependencies: Function[]) {
  const existing = Reflect.getMetadata('design:paramtypes', target) as
    | Array<unknown>
    | undefined;

  if (!existing || existing.length === 0 || existing.every((dep) => dep === Object)) {
    Reflect.defineMetadata('design:paramtypes', dependencies, target);
  }
}

ensureMetadata(AuthController, [AuthService]);
ensureMetadata(AuthService, [
  PrismaService,
  AuditService,
  AnalyticsService,
  TokenService,
  OtpService,
]);
ensureMetadata(OtpService, [PrismaService]);
ensureMetadata(AnalyticsService, [AuditService]);
ensureMetadata(RolesController, [RolesService]);
ensureMetadata(RolesService, [PrismaService, AuditService]);
ensureMetadata(FeatureFlagsController, [FeatureFlagsService]);
ensureMetadata(FeatureFlagsService, [PrismaService, AuditService]);
ensureMetadata(AuditController, [AuditService]);
ensureMetadata(AuditService, [PrismaService]);
ensureMetadata(TokenService, [ConfigService]);
ensureMetadata(JwtAuthGuard, [TokenService]);
ensureMetadata(RolesGuard, [Reflector]);
ensureMetadata(TelemetryController, [TelemetryService]);
ensureMetadata(TelemetryService, [PrismaService, RateLimitMonitorService]);
