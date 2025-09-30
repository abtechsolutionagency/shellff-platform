import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleType } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import type { EnvConfig } from '../config/env.validation';
import { TokenService } from './token.service';

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function expectUnauthorizedWithMessage(
  action: () => void,
  message: string,
) {
  try {
    action();
    throw new Error('Expected UnauthorizedException');
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
    const response = (error as UnauthorizedException).getResponse();

    if (typeof response === 'string') {
      expect(response).toBe(message);
    } else if (Array.isArray(response)) {
      expect(response).toContain(message);
    } else {
      expect(response).toEqual(
        expect.objectContaining({
          message,
        }),
      );
    }
  }
}

describe('TokenService verify', () => {
  let service: TokenService;
  let config: EnvConfig;

  beforeEach(() => {
    config = {
      NODE_ENV: 'test',
      APP_PORT: 3000,
      DATABASE_URL: 'postgres://localhost:5432/shellff',
      REDIS_URL: 'redis://localhost:6379',
      MINIO_ENDPOINT: 'http://localhost:9000',
      MINIO_ACCESS_KEY: 'shellff',
      MINIO_SECRET_KEY: 'shellffsecret',
      FEATURE_FLAG_CACHE_TTL_SECONDS: 60,
      JWT_ACCESS_TOKEN_SECRET: 'access-secret',
      JWT_ACCESS_TOKEN_TTL_SECONDS: 3600,
      JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
      JWT_REFRESH_TOKEN_TTL_SECONDS: 60 * 60 * 24,
    } satisfies EnvConfig;

    const configService = new ConfigService<EnvConfig, true>(config);
    service = new TokenService(configService);
  });

  it('throws when token segments are missing', () => {
    expectUnauthorizedWithMessage(
      () => service.verifyAccessToken('bad.token'),
      'Malformed token',
    );
    expectUnauthorizedWithMessage(
      () => service.verifyRefreshToken('bad.token'),
      'Malformed token',
    );
  });

  it('throws when the access token header cannot be decoded', () => {
    const validToken = service.signAccessToken({
      sub: 'user-1',
      roles: [RoleType.LISTENER],
      primaryRole: RoleType.LISTENER,
    });
    const [, payloadSegment] = validToken.token.split('.');

    const invalidHeaderSegment = '***';
    const signed = createHmac('sha256', config.JWT_ACCESS_TOKEN_SECRET)
      .update(`${invalidHeaderSegment}.${payloadSegment}`)
      .digest('base64url');
    const malformedToken = `${invalidHeaderSegment}.${payloadSegment}.${signed}`;

    expectUnauthorizedWithMessage(
      () => service.verifyAccessToken(malformedToken),
      'Malformed token header',
    );
  });

  it('throws when the refresh token payload is invalid JSON', () => {
    const validToken = service.signRefreshToken({
      sub: 'user-1',
      jti: 'refresh-id',
    });
    const [headerSegment] = validToken.token.split('.');
    const invalidPayload = base64UrlEncode('{');
    const signature = createHmac('sha256', config.JWT_REFRESH_TOKEN_SECRET)
      .update(`${headerSegment}.${invalidPayload}`)
      .digest('base64url');
    const malformedToken = `${headerSegment}.${invalidPayload}.${signature}`;

    expectUnauthorizedWithMessage(
      () => service.verifyRefreshToken(malformedToken),
      'Malformed token payload',
    );
  });
});
