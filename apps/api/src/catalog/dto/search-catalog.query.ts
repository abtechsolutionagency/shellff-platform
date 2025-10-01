import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class SearchCatalogQueryDto {
  @IsString()
  query!: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number.parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  @Max(50)
  take?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number.parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  @Max(50)
  trackTake?: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    return Boolean(value);
  })
  @IsBoolean()
  personalized?: boolean;
}
