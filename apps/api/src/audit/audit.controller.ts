import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class AuditQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLatest(@Query() query: AuditQueryDto) {
    const limit = query.limit ?? 20;
    const logs = await this.auditService.latest(limit);
    return { logs };
  }
}
