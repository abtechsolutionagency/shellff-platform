import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { RoleType } from '@prisma/client';

import { TokenService } from './token.service';

type RequestWithUser = Request & {
  user?: {
    userId: string;
    roles: RoleType[];
    primaryRole: RoleType;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers['authorization'];

    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const payload = this.tokenService.verifyAccessToken(token);
    request.user = {
      userId: payload.sub,
      roles: payload.roles,
      primaryRole: payload.primaryRole,
    };

    return true;
  }
}
