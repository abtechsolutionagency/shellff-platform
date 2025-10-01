import type { Prisma } from '@prisma/client';
import type { Request } from 'express';

export type SessionDeviceMetadata = {
  fingerprint?: string | null;
  name?: string | null;
  type?: string | null;
  platform?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  pushToken?: string | null;
  trusted?: boolean | null;
};

export type SessionMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: Prisma.InputJsonValue;
  device?: SessionDeviceMetadata;
};

function readHeader(request: Request, header: string): string | undefined {
  const value = request.get(header);
  return value && value.length > 0 ? value : undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }

  if (value.toLowerCase() === 'true') {
    return true;
  }

  if (value.toLowerCase() === 'false') {
    return false;
  }

  return undefined;
}

function parseLocation(
  locationHeader: string | undefined,
): Prisma.InputJsonValue | undefined {
  if (!locationHeader) {
    return undefined;
  }

  try {
    return JSON.parse(locationHeader) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

function extractIpAddress(request: Request): string | undefined {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    const [first] = forwardedFor.split(',');
    if (first) {
      return first.trim();
    }
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0];
  }

  return request.ip ?? undefined;
}

export function extractSessionMetadata(request: Request): SessionMetadata {
  const userAgent = readHeader(request, 'user-agent');
  const locationHeader = readHeader(request, 'x-device-location');

  const deviceFingerprint = readHeader(request, 'x-device-fingerprint');
  const deviceName = readHeader(request, 'x-device-name');
  const deviceType = readHeader(request, 'x-device-type');
  const devicePlatform = readHeader(request, 'x-device-platform');
  const deviceOsVersion = readHeader(request, 'x-device-os-version');
  const appVersion = readHeader(request, 'x-app-version');
  const pushToken = readHeader(request, 'x-device-push-token');
  const trusted = parseBoolean(readHeader(request, 'x-device-trusted'));

  const device: SessionDeviceMetadata | undefined =
    deviceFingerprint ||
    deviceName ||
    deviceType ||
    devicePlatform ||
    deviceOsVersion ||
    appVersion ||
    pushToken ||
    trusted !== undefined
      ? {
          fingerprint: deviceFingerprint ?? null,
          name: deviceName ?? null,
          type: deviceType ?? null,
          platform: devicePlatform ?? null,
          osVersion: deviceOsVersion ?? null,
          appVersion: appVersion ?? null,
          pushToken: pushToken ?? null,
          trusted: trusted ?? null,
        }
      : undefined;

  return {
    ipAddress: extractIpAddress(request) ?? null,
    userAgent: userAgent ?? null,
    location: parseLocation(locationHeader),
    device,
  };
}
