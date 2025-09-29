import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [PrismaModule],
  controllers: [TelemetryController],
  providers: [TelemetryService],
})
export class TelemetryModule {}
