import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const DEFAULT_COVER = '/api/placeholder/400/400';

type CreatorLike = {
  firstName: string | null;
  lastName: string | null;
  username: string;
};

function formatArtistName(creator: CreatorLike): string {
  const parts = [creator.firstName, creator.lastName]
    .filter(Boolean)
    .map((part) => part!.trim());
  return parts.length > 0 ? parts.join(' ') : creator.username;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const accesses = await prisma.releaseAccess.findMany({
      where: { userId: user.id },
      orderBy: { grantedAt: 'desc' },
      include: {
        release: {
          include: {
            creator: {
              select: { firstName: true, lastName: true, username: true },
            },
            releaseTracks: {
              select: { id: true },
            },
          },
        },
      },
    });

    const items = accesses.map((access) => {
      const { release } = access;
      const artist = formatArtistName(release.creator);
      const expiresAt = access.expiresAt ?? null;
      const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

      return {
        accessId: access.id,
        releaseId: access.releaseId,
        title: release.title,
        artist,
        cover: release.coverArt || DEFAULT_COVER,
        releaseType: release.releaseType,
        trackCount: release.releaseTracks.length,
        grantedAt: access.grantedAt.toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        source: access.source,
        status: isExpired ? 'expired' : 'active',
        metadata: access.metadata ?? undefined,
      };
    });

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('Failed to fetch release access records', error);
    return NextResponse.json({ error: 'Failed to fetch release access records' }, { status: 500 });
  }
}
