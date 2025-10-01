import { Module } from '@nestjs/common';

import { AnalyticsModule } from '../analytics/analytics.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';

import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogPipelineService } from './catalog.pipeline.service';
import { CatalogIngestionService } from './catalog.ingestion.service';

@Module({
  imports: [PrismaModule, AuditModule, AnalyticsModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogPipelineService, CatalogIngestionService],
  exports: [CatalogService, CatalogPipelineService],
})
export class CatalogModule {}
