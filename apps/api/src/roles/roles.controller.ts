import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { GrantRoleDto } from './dto/grant-role.dto';
import { UpgradeCreatorDto } from './dto/upgrade-creator.dto';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
