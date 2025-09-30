import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DownloadFormat, DownloadStatus } from '@prisma/client';

import { AnalyticsService } from '../analytics/analytics.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { RequestDownloadBundleDto } from './dto/request-download-bundle.dto';

const DEFAULT_EXPIRY_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const DEFAULT_FORMAT = DownloadFormat.MP3;

@Injectable()
export class DownloadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async requestBundle(
    userId: string,
    dto: RequestDownloadBundleDto,
    context: { requestId?: string } = {},
  ) {
    if (!dto.releaseId && !dto.trackIds?.length) {
      throw new BadRequestException('Provide a releaseId or at least one trackId');
    }

    const format = dto.format ?? DEFAULT_FORMAT;

    const tracks = await this.resolveTracks(dto);

    if (!tracks.length) {
      throw new NotFoundException('No tracks found for download');
    }

    const releaseId = tracks[0].releaseId;

    const hasAccess = await this.prisma.releaseAccess.findFirst({
      where: { userId, releaseId },
    });

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this release');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEFAULT_EXPIRY_MS);

    await this.auditService.recordEvent({
      actorUserId: userId,
      actorType: 'api',
      event: 'downloads.bundle.requested',
      metadata: {
        releaseId,
        trackIds: tracks.map((track) => track.id),
        format,
      },
      requestId: context.requestId ?? null,
    });

    await this.analyticsService.track(
      'downloads.bundle.requested',
      {
        releaseId,
        trackIds: tracks.map((track) => track.id),
        format,
      },
      { userId, requestId: context.requestId ?? null },
    );

    const { bundle, assets } = await this.prisma.$transaction(async (tx) => {
      const createdBundle = await tx.downloadBundle.create({
        data: {
          userId,
          releaseId,
          status: DownloadStatus.PREPARING,
          requestedAt: now,
          expiresAt,
        },
      });

      const createdAssets = [] as Array<{
        id: string;
        trackId: string;
      }>;

      for (const track of tracks) {
        const asset = await tx.downloadAsset.create({
          data: {
            bundleId: createdBundle.id,
            trackId: track.id,
            format,
            quality: track.duration ? `${Math.max(128, Math.min(320, Math.round(track.duration / 10) * 10))}kbps` : '320kbps',
            status: DownloadStatus.PREPARING,
          },
        });
        createdAssets.push({ id: asset.id, trackId: track.id });
      }

      const readyAssets = [] as typeof createdAssets;

      for (const asset of createdAssets) {
        const track = tracks.find((item) => item.id === asset.trackId);
        const downloadUrl = track?.audioUrl ?? this.buildFallbackDownloadUrl(track?.id ?? asset.trackId, format);
        const updated = await tx.downloadAsset.update({
          where: { id: asset.id },
          data: {
            status: DownloadStatus.READY,
            downloadUrl,
            sizeBytes: track?.duration ? track.duration * 16000 : null,
            checksum: track?.audioUrl ? undefined : 'pending-checksum',
          },
        });
        readyAssets.push({ id: updated.id, trackId: updated.trackId });
      }

      const completedBundle = await tx.downloadBundle.update({
        where: { id: createdBundle.id },
        data: {
          status: DownloadStatus.READY,
          completedAt: new Date(),
        },
        include: {
          assets: {
            select: {
              id: true,
              trackId: true,
              format: true,
              quality: true,
              sizeBytes: true,
              downloadUrl: true,
              status: true,
            },
          },
        },
      });

      return { bundle: completedBundle, assets: completedBundle.assets };
    });

    await this.auditService.recordEvent({
      actorUserId: userId,
      actorType: 'api',
      event: 'downloads.bundle.ready',
      target: bundle.id,
      metadata: {
        releaseId,
        trackIds: assets.map((asset) => asset.trackId),
        format,
      },
      requestId: context.requestId ?? null,
    });

    await this.analyticsService.track(
      'downloads.bundle.ready',
      {
        releaseId,
        trackIds: assets.map((asset) => asset.trackId),
        format,
      },
      { userId, requestId: context.requestId ?? null, target: bundle.id },
    );

    return {
      bundle: {
        id: bundle.id,
        status: bundle.status,
        releaseId: bundle.releaseId,
        requestedAt: bundle.requestedAt,
        completedAt: bundle.completedAt,
        expiresAt: bundle.expiresAt,
      },
      assets: bundle.assets.map((asset) => ({
        id: asset.id,
        trackId: asset.trackId,
        format: asset.format,
        quality: asset.quality,
        sizeBytes: asset.sizeBytes,
        downloadUrl: asset.downloadUrl,
        status: asset.status,
      })),
    };
  }

  async getBundle(userId: string, bundleId: string) {
    const bundle = await this.prisma.downloadBundle.findFirst({
      where: { id: bundleId, userId },
      include: {
        assets: {
          select: {
            id: true,
            trackId: true,
            format: true,
            quality: true,
            sizeBytes: true,
            downloadUrl: true,
            status: true,
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException('Download bundle not found');
    }

    return {
      bundle: {
        id: bundle.id,
        status: bundle.status,
        releaseId: bundle.releaseId,
        requestedAt: bundle.requestedAt,
        completedAt: bundle.completedAt,
        expiresAt: bundle.expiresAt,
      },
      assets: bundle.assets,
    };
  }

  private async resolveTracks(dto: RequestDownloadBundleDto) {
    if (dto.trackIds?.length) {
      const tracks = await this.prisma.releaseTrack.findMany({
        where: { id: { in: dto.trackIds } },
        select: {
          id: true,
          releaseId: true,
          duration: true,
          position: true,
          audioUrl: true,
        },
      });

      const releaseIds = Array.from(new Set(tracks.map((track) => track.releaseId)));

      if (dto.releaseId && releaseIds.length && (releaseIds.length !== 1 || releaseIds[0] !== dto.releaseId)) {
        throw new BadRequestException('Track list does not belong to the provided release');
      }

      return tracks;
    }

    if (dto.releaseId) {
      const tracks = await this.prisma.releaseTrack.findMany({
        where: { releaseId: dto.releaseId },
        select: {
          id: true,
          releaseId: true,
          duration: true,
          position: true,
          audioUrl: true,
        },
        orderBy: { position: 'asc' },
      });

      if (!tracks.length) {
        throw new NotFoundException('No tracks available for this release');
      }

      return tracks;
    }

    return [];
  }

  private buildFallbackDownloadUrl(trackId: string, format: DownloadFormat) {
    return `https://cdn.shellff.dev/downloads/${trackId}.${format.toLowerCase()}`;
  }
}
