import { FeatureFlagEnvironment } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class EvaluateFlagDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(FeatureFlagEnvironment)
  environment?: FeatureFlagEnvironment;
}
