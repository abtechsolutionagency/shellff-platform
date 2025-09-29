
import crypto from 'crypto';

export interface DeviceFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  fingerprint: string;
}

/**
 * Generate a device fingerprint based on request headers (Server-side only)
 * This should only be called from API routes or server components
 */
export function generateServerDeviceFingerprint(headersList: Headers): DeviceFingerprint {
  const userAgent = headersList.get('user-agent') || '';
  const acceptLanguage = headersList.get('accept-language') || '';
  const acceptEncoding = headersList.get('accept-encoding') || '';
  const xForwardedFor = headersList.get('x-forwarded-for') || '';
  const xRealIp = headersList.get('x-real-ip') || '';
  
  // Create a composite string from various headers
  const composite = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    xForwardedFor,
    xRealIp,
  ].join('|');
  
  // Generate a hash of the composite string
  const fingerprint = crypto
    .createHash('sha256')
    .update(composite)
    .digest('hex')
    .substring(0, 32); // Use first 32 characters
  
  return {
    userAgent,
    acceptLanguage,
    acceptEncoding,
    fingerprint,
  };
}

/**
 * Get client IP address from request headers (Server-side only)
 */
export function getServerClientIp(headersList: Headers): string | null {
  // Try various headers in order of preference
  const xForwardedFor = headersList.get('x-forwarded-for');
  const xRealIp = headersList.get('x-real-ip');
  const xClientIp = headersList.get('x-client-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIp) {
    return xRealIp.trim();
  }
  
  if (xClientIp) {
    return xClientIp.trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  return null;
}

/**
 * Client-side fingerprinting function (to be called from the browser)
 */
export const generateClientFingerprint = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 2, 2);
  const canvasFingerprint = canvas.toDataURL();
  
  const screenFingerprint = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezoneFingerprint = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const languageFingerprint = navigator.languages.join(',');
  const platformFingerprint = navigator.platform;
  const hardwareConcurrency = navigator.hardwareConcurrency || 0;
  
  const composite = [
    navigator.userAgent,
    screenFingerprint,
    timezoneFingerprint,
    languageFingerprint,
    platformFingerprint,
    hardwareConcurrency.toString(),
    canvasFingerprint,
  ].join('|');
  
  // Simple hash function for client-side
  let hash = 0;
  for (let i = 0; i < composite.length; i++) {
    const char = composite.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0');
};
