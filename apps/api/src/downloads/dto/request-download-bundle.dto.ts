import { DownloadFormat } from '@prisma/client';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class RequestDownloadBundleDto {
  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  trackIds?: string[];

  @IsOptional()
  @IsEnum(DownloadFormat)
  format?: DownloadFormat;
}
