import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { encode, getToken } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';
import { UserType } from '@prisma/client';
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
type ExtendedJWT = JWT & {
  id?: string;
  userType?: UserType;
  sciId?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};
async function refreshSessionCookie(
  request: NextRequest,
  response: NextResponse,
  updates: {
    userType: UserType;
    sciId: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }
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
  const token = existingToken as ExtendedJWT;
  const sessionMaxAge = authOptions.session?.maxAge ?? 30 * 24 * 60 * 60;
  const tokenPayload: ExtendedJWT = {
    ...token,
    userType: updates.userType,
    sciId: updates.sciId ?? null,
    name: updates.username ?? existingToken.name ?? undefined,
    firstName: updates.firstName ?? token.firstName ?? null,
    lastName: updates.lastName ?? token.lastName ?? null,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + sessionMaxAge,
  };
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
  }