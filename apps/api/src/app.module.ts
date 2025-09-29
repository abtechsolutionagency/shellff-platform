import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { RolesModule } from './roles/roles.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../install/.env', '../../install/.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    RolesModule,
    FeatureFlagsModule,
    TelemetryModule,
  ],
})
export class AppModule {}
