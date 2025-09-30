import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { ConfigService } from '@nestjs/config';

import type { EnvConfig } from '../config/env.validation';

const TOKEN_ALG = 'HS256';

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

type AccessTokenPayload = {
  sub: string;
  roles: RoleType[];
  primaryRole: RoleType;
  type: 'access';
};

type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: 'refresh';
};

type SignedToken<TPayload> = {
  token: string;
  payload: TPayload & { iat: number; exp: number };
  issuedAt: Date;
  expiresAt: Date;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): SignedToken<AccessTokenPayload> {
    const ttlSeconds = this.configService.getOrThrow<number>(
      'JWT_ACCESS_TOKEN_TTL_SECONDS',
    );
    const secret = this.configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_SECRET',
    );
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const fullPayload: AccessTokenPayload & { iat: number; exp: number } = {
      ...payload,
      type: 'access',
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + ttlSeconds,
    };

    const token = this.sign(fullPayload, secret);
    return {
      token,
      payload: fullPayload,
      issuedAt: new Date(fullPayload.iat * 1000),
      expiresAt: new Date(fullPayload.exp * 1000),
    };
  }

  signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): SignedToken<RefreshTokenPayload> {
    const ttlSeconds = this.configService.getOrThrow<number>(
      'JWT_REFRESH_TOKEN_TTL_SECONDS',
    );
    const secret = this.configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_SECRET',
    );
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const fullPayload: RefreshTokenPayload & { iat: number; exp: number } = {
      ...payload,
      type: 'refresh',
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + ttlSeconds,
    };

    const token = this.sign(fullPayload, secret);
    return {
      token,
      payload: fullPayload,
      issuedAt: new Date(fullPayload.iat * 1000),
      expiresAt: new Date(fullPayload.exp * 1000),
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload & { iat: number; exp: number } {
    const secret = this.configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_SECRET',
    );
    const payload = this.verify(token, secret);

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    return payload as AccessTokenPayload & { iat: number; exp: number };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload & { iat: number; exp: number } {
    const secret = this.configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_SECRET',
    );
    const payload = this.verify(token, secret);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload as RefreshTokenPayload & { iat: number; exp: number };
  }

  private sign(
    payload: { iat: number; exp: number } & Record<string, unknown>,
    secret: string,
  ): string {
    const header = base64UrlEncode(JSON.stringify({ alg: TOKEN_ALG, typ: 'JWT' }));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = createHmac('sha256', secret)
      .update(`${header}.${encodedPayload}`)
      .digest('base64url');
    return `${header}.${encodedPayload}.${signature}`;
  }

  private verify(token: string, secret: string): { iat: number; exp: number } & Record<string, any> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed token');
    }

    const [header, payload, signature] = parts;
    const expectedSignature = createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const headerJson = JSON.parse(base64UrlDecode(header));
    if (headerJson.alg !== TOKEN_ALG) {
      throw new UnauthorizedException('Unsupported token algorithm');
    }

    const payloadJson = JSON.parse(base64UrlDecode(payload));
    if (
      typeof payloadJson.exp !== 'number' ||
      typeof payloadJson.iat !== 'number'
    ) {
      throw new UnauthorizedException('Invalid token claims');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payloadJson.exp <= nowSeconds) {
      throw new UnauthorizedException('Token has expired');
    }

    return payloadJson;
  }
}
