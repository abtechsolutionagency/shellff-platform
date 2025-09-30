import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class ListReleasesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  creatorId?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number.parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number.parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  @Max(50)
  take?: number;
}
