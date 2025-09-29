
import QRCode from 'qrcode';

export interface BarcodeOptions {
  format: 'svg' | 'png';
  width?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
}

export async function generateQRCode(
  code: string, 
  options: BarcodeOptions = { format: 'svg' }
): Promise<string> {
  try {
    const qrOptions = {
      width: options.width || 200,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF'
      }
    };

    if (options.format === 'svg') {
      return await QRCode.toString(code, { 
        ...qrOptions,
        type: 'svg'
      });
    } else {
      return await QRCode.toDataURL(code, {
        ...qrOptions,
        type: 'image/png'
      });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function generateBatchBarcodes(
  codes: string[],
  options: BarcodeOptions = { format: 'svg' }
): Promise<{ code: string; barcode: string }[]> {
  const results = [];
  
  for (const code of codes) {
    try {
      const barcode = await generateQRCode(code, options);
      results.push({ code, barcode });
    } catch (error) {
      console.error(`Failed to generate barcode for code ${code}:`, error);
      // Continue with other codes even if one fails
      results.push({ code, barcode: '' });
    }
  }
  
  return results;
}

export function createSVGBarcode(code: string, qrSvg: string): string {
  return `
    <div style="text-align: center; padding: 20px; border: 1px solid #ccc; margin: 10px;">
      <div style="font-family: monospace; font-weight: bold; margin-bottom: 10px;">${code}</div>
      ${qrSvg}
      <div style="font-size: 12px; margin-top: 10px; color: #666;">
        Scan to unlock album on Shellff
      </div>
    </div>
  `;
}
