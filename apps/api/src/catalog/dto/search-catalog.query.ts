import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

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
}
