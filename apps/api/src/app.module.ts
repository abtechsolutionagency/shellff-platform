import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { DownloadsModule } from './downloads/downloads.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { RolesModule } from './roles/roles.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { MonitoredThrottlerStorageService } from './telemetry/monitored-throttler.storage';
import { RateLimitMonitorService } from './telemetry/rate-limit-monitor.service';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../install/.env', '../../install/.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    CatalogModule,
    DownloadsModule,
    RolesModule,
    FeatureFlagsModule,
    TelemetryModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: MonitoredThrottlerStorageService,
      useFactory: (monitor: RateLimitMonitorService) =>
        new MonitoredThrottlerStorageService(monitor),
      inject: [RateLimitMonitorService],
    },
    {
      provide: ThrottlerStorageService,
      useExisting: MonitoredThrottlerStorageService,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
