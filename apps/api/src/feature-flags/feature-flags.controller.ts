import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { EvaluateFlagDto } from './dto/evaluate-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-flag.dto';
import { UpsertFlagOverrideDto } from './dto/upsert-override.dto';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get(':key/evaluate')
  evaluate(@Param('key') key: string, @Query() query: EvaluateFlagDto) {
    return this.featureFlagsService.evaluate(key, query);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.featureFlagsService.updateFlag(key, dto);
  }

  @Post(':key/overrides')
  upsertOverride(@Param('key') key: string, @Body() dto: UpsertFlagOverrideDto) {
    return this.featureFlagsService.upsertOverride(key, dto);
  }
}
