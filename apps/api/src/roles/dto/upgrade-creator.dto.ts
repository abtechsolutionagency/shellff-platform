import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpgradeCreatorDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsString()
  actorType!: string;
}
