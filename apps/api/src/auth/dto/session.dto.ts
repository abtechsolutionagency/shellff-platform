import { RoleType, SessionStatus } from '@prisma/client';

export type AuthSession = {
  user: {
    id: string;
    publicId: string | null;
    email: string;
    displayName: string;
    phone?: string | null;
    primaryRole: RoleType;
    roles: RoleType[];
    sciId?: string | null;
    status: string;
  };
  session: {
    id: string;
    status: SessionStatus;
    deviceId?: string | null;
    expiresAt: string;
    lastSeenAt?: string | null;
  };
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    tokenType: 'Bearer';
    refreshTokenId: string;
    sessionId: string;
  };
};
