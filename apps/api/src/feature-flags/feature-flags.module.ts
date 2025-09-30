import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  imports: [ConfigModule, PrismaModule, AuditModule, AuthModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
