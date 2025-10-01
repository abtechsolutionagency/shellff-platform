import { Module, forwardRef } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';

import { AnalyticsService } from './analytics.service';

@Module({
  imports: [forwardRef(() => AuditModule)],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
