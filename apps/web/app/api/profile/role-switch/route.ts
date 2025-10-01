
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { encode, getToken } from 'next-auth/jwt';

const roleSwitchSchema = z.object({
  newRole: z.enum(['LISTENER', 'CREATOR']),
});

// Generate SCI ID for new creators
function generateSciId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SCI${timestamp}${random}`;
}

const SESSION_TOKEN_COOKIE = '__Secure-next-auth.session-token';
const LEGACY_SESSION_TOKEN_COOKIE = 'next-auth.session-token';

async function refreshSessionCookie(
  request: NextRequest,
  response: NextResponse,
  updates: { userType: string; sciId: string | null; username?: string | null; firstName?: string | null; lastName?: string | null }
) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn('NEXTAUTH_SECRET is not configured; session cookie will not be refreshed.');
    return response;
  }

  const existingToken = await getToken({ req: request, secret });

  if (!existingToken) {
    return response;
  }

  const sessionMaxAge = authOptions.session?.maxAge ?? 30 * 24 * 60 * 60;

  const tokenPayload = {
    ...existingToken,
    userType: updates.userType,
    sciId: updates.sciId ?? null,
    name: updates.username ?? existingToken.name,
    firstName: updates.firstName ?? (existingToken as Record<string, unknown>).firstName,
    lastName: updates.lastName ?? (existingToken as Record<string, unknown>).lastName,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + sessionMaxAge,
  } as Record<string, unknown>;

  const encodedToken = await encode({
    token: tokenPayload,
    secret,
    maxAge: sessionMaxAge,
  });

  const secureCookie =
    request.cookies.has(SESSION_TOKEN_COOKIE) ||
    process.env.NODE_ENV === 'production' ||
    (process.env.NEXTAUTH_URL?.startsWith('https://') ?? false);

  const cookieName = request.cookies.has(SESSION_TOKEN_COOKIE)
    ? SESSION_TOKEN_COOKIE
    : request.cookies.has(LEGACY_SESSION_TOKEN_COOKIE)
    ? LEGACY_SESSION_TOKEN_COOKIE
    : secureCookie
    ? SESSION_TOKEN_COOKIE
    : LEGACY_SESSION_TOKEN_COOKIE;

  response.cookies.set(cookieName, encodedToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieName === SESSION_TOKEN_COOKIE,
    path: '/',
    maxAge: sessionMaxAge,
  });

  return response;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newRole } = roleSwitchSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, userType: true, sciId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If switching to creator and doesn't have SCI ID, generate one
    let sciIdUpdate = {};
    if (newRole === 'CREATOR' && !user.sciId) {
      let sciId = generateSciId();
      
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { sciId },
        });
        
        if (!existing) break;
        
        sciId = generateSciId();
        attempts++;
      }
      
      if (attempts >= 10) {
        return NextResponse.json(
          { error: 'Unable to generate unique Creator ID. Please try again.' },
          { status: 500 }
        );
      }
      
      sciIdUpdate = { sciId };
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        userType: newRole,
        ...sciIdUpdate,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        userType: true,
        sciId: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    const response = NextResponse.json({
      message: `Successfully switched to ${newRole.toLowerCase()}`,
      user: updatedUser,
    });
    await refreshSessionCookie(request, response, {
      userType: updatedUser.userType,
      sciId: updatedUser.sciId ?? null,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }
    
    console.error('Role switch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

