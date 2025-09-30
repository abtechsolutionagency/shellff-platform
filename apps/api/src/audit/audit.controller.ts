import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { RoleType } from '@prisma/client';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class AuditQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsUUID()
  cursor?: string;
}

const MANAGEMENT_ROLES: RoleType[] = ['ADMIN', 'MODERATOR'];

@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(...MANAGEMENT_ROLES)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLatest(@Query() query: AuditQueryDto) {
    const limit = query.limit ?? 20;
    const { logs, nextCursor } = await this.auditService.latest(limit, query.cursor);
    return { logs, nextCursor };
  }
}
