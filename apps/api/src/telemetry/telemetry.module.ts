import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { RateLimitMonitorService } from './rate-limit-monitor.service';

@Module({
  imports: [PrismaModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, RateLimitMonitorService],
  exports: [TelemetryService, RateLimitMonitorService],
})
export class TelemetryModule {}
