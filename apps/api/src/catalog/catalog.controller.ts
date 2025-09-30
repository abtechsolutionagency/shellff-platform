import { Controller, Get, NotFoundException, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { CatalogService } from './catalog.service';
import { ListReleasesQueryDto } from './dto/list-releases.query';
import { SearchCatalogQueryDto } from './dto/search-catalog.query';

type RequestWithUser = Request & {
  user?: {
    userId: string;
  };
};

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('releases')
  listReleases(@Query() query: ListReleasesQueryDto, @Req() req: RequestWithUser) {
    return this.catalogService.listReleases(query, {
      userId: req.user?.userId,
      requestId: req.headers['x-request-id']?.toString(),
    });
  }

  @Get('releases/:id')
  async getRelease(@Param('id') id: string, @Req() req: RequestWithUser) {
    const release = await this.catalogService.getRelease(id, {
      userId: req.user?.userId,
      requestId: req.headers['x-request-id']?.toString(),
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    return release;
  }

  @Get('search')
  search(@Query() query: SearchCatalogQueryDto, @Req() req: RequestWithUser) {
    return this.catalogService.search(query, {
      userId: req.user?.userId,
      requestId: req.headers['x-request-id']?.toString(),
    });
  }
}
