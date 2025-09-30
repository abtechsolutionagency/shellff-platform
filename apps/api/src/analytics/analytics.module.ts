import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';

import { AnalyticsService } from './analytics.service';

@Module({
  imports: [AuditModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
