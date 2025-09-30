import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { DownloadsService } from './downloads.service';
import { RequestDownloadBundleDto } from './dto/request-download-bundle.dto';

type RequestWithUser = Request & {
  user: {
    userId: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Post('bundles')
  requestBundle(@Req() req: RequestWithUser, @Body() dto: RequestDownloadBundleDto) {
    return this.downloadsService.requestBundle(req.user.userId, dto, {
      requestId: req.headers['x-request-id']?.toString(),
    });
  }

  @Get('bundles/:id')
  getBundle(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.downloadsService.getBundle(req.user.userId, id);
  }
}
