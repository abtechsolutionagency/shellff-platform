
export function generateUniqueCode(): string {
  const prefix = 'SHF';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  // Generate two 4-character segments
  const segment1 = Array.from({ length: 4 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  
  const segment2 = Array.from({ length: 4 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  
  return `${prefix}-${segment1}-${segment2}`;
}

export function generateBatchCodes(quantity: number): string[] {
  const codes = new Set<string>();
  
  while (codes.size < quantity) {
    const code = generateUniqueCode();
    codes.add(code);
  }
  
  return Array.from(codes);
}

export function validateCodeFormat(code: string): boolean {
  // Format: SHF-XXXX-XXXX where X is alphanumeric
  const pattern = /^SHF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}
