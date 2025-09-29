const CODE_PREFIX = 'SHF';
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude easily confused chars

export const UNLOCK_CODE_REGEX = /^SHF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function generateSegment(length: number): string {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * ALPHANUMERIC.length);
    return ALPHANUMERIC[index];
  }).join('');
}

export function generateUniqueCode(): string {
  const segment1 = generateSegment(4);
  const segment2 = generateSegment(4);
  return `${CODE_PREFIX}-${segment1}-${segment2}`;
}

export function normalizeUnlockCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function generateBatchCodes(quantity: number): string[] {
  const codes = new Set<string>();
  while (codes.size < quantity) {
    codes.add(generateUniqueCode());
  }
  return Array.from(codes);
}

export function validateCodeFormat(code: string): boolean {
  return UNLOCK_CODE_REGEX.test(normalizeUnlockCode(code));
}
