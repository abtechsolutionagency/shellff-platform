
import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    
    if (!key) {
      return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
    }

    // Decode the key if it was URL encoded
    const decodedKey = decodeURIComponent(key);
    
    // Get signed URL for the file
    const signedUrl = await downloadFile(decodedKey);
    
    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Media serve error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
