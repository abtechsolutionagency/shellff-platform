import { FeatureFlagRolloutType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFeatureFlagDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(FeatureFlagRolloutType)
  rolloutType?: FeatureFlagRolloutType;

  @IsString()
  actorType!: string;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;
}
