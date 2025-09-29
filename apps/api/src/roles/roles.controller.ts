import { Body, Controller, Post } from '@nestjs/common';

import { GrantRoleDto } from './dto/grant-role.dto';
import { UpgradeCreatorDto } from './dto/upgrade-creator.dto';
import { RolesService } from './roles.service';

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
