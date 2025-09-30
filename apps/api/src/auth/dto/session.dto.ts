import { RoleType } from '@prisma/client';

export type AuthSession = {
  user: {
    id: string;
    email: string;
    displayName: string;
    phone?: string | null;
    primaryRole: RoleType;
    roles: RoleType[];
    creatorId?: string | null;
    status: string;
  };
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    tokenType: 'Bearer';
  };
};
