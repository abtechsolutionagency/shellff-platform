import { FeatureFlagEnvironment } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpsertFlagOverrideDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(FeatureFlagEnvironment)
  environment?: FeatureFlagEnvironment;

  @IsBoolean()
  value!: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  actorType!: string;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;
}
