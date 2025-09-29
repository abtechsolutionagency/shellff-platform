import { RoleType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class GrantRoleDto {
  @IsUUID()
  userId!: string;

  @IsEnum(RoleType)
  role!: RoleType;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsString()
  actorType!: string;
}
