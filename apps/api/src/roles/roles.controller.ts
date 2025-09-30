import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { RoleType } from '@prisma/client';

import { GrantRoleDto } from './dto/grant-role.dto';
import { UpgradeCreatorDto } from './dto/upgrade-creator.dto';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

const MANAGEMENT_ROLES: RoleType[] = ['ADMIN', 'MODERATOR'];

@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(...MANAGEMENT_ROLES)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post('grant')
  grant(@Body() dto: GrantRoleDto) {
    return this.rolesService.grantRole(dto);
  }

  @Post('upgrade/creator')
  upgradeCreator(@Body() dto: UpgradeCreatorDto) {
    return this.rolesService.upgradeToCreator(dto);
  }
}
