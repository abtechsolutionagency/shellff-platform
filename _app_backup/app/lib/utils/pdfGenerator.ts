
import { jsPDF } from 'jspdf';

export interface PDFCodeData {
  code: string;
  barcode: string; // Base64 data URL or SVG string
  albumTitle: string;
  artistName: string;
}

export function generateCodesPDF(
  codes: PDFCodeData[], 
  albumInfo: { title: string; artist: string }
): Buffer {
  const safeAlbumInfo = {
    title: albumInfo.title || 'Unknown Album',
    artist: albumInfo.artist || 'Unknown Artist'
  };
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const codesPerPage = 4;
  let currentY = margin;
  let codeCount = 0;

  // Title page
  pdf.setFontSize(20);
  pdf.text('Shellff Unlock Codes', pageWidth / 2, 30, { align: 'center' } as any);
  
  pdf.setFontSize(16);
  pdf.text(`Album: ${safeAlbumInfo.title}`, pageWidth / 2, 50, { align: 'center' } as any);
  pdf.text(`Artist: ${safeAlbumInfo.artist}`, pageWidth / 2, 65, { align: 'center' } as any);
  
  pdf.setFontSize(12);
  pdf.text(`Total Codes: ${codes.length}`, pageWidth / 2, 85, { align: 'center' } as any);
  pdf.text('Generated: ' + new Date().toLocaleDateString(), pageWidth / 2, 100, { align: 'center' } as any);

  // Instructions
  pdf.setFontSize(10);
  const instructions = [
    'Instructions for customers:',
    '1. Download the Shellff app from your app store',
    '2. Create an account or log in',
    '3. Go to "My Shellff" section',
    '4. Tap "Scan Barcode" or "Enter Code"',
    '5. Scan the QR code or manually enter the code',
    '6. Enjoy your digital album!'
  ];
  
  let instructionY = 120;
  instructions.forEach(instruction => {
    pdf.text(instruction, margin, instructionY);
    instructionY += 8;
  });

  // Start codes on new page
  pdf.addPage();
  currentY = margin;

  codes.forEach((codeData, index) => {
    if (codeCount >= codesPerPage) {
      pdf.addPage();
      currentY = margin;
      codeCount = 0;
    }

    const sectionHeight = (pageHeight - 2 * margin) / codesPerPage;
    const sectionY = margin + (codeCount * sectionHeight);

    // Code section border
    pdf.rect(margin, sectionY, pageWidth - 2 * margin, sectionHeight - 5);

    // Album info
    pdf.setFontSize(12);
    pdf.text(safeAlbumInfo.title, margin + 10, sectionY + 20);
    pdf.setFontSize(10);
    pdf.text(`by ${safeAlbumInfo.artist}`, margin + 10, sectionY + 30);

    // Code
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Code: ${codeData.code}`, margin + 10, sectionY + 50);
    pdf.setFont('helvetica', 'normal');

    // QR Code placeholder (in a real implementation, you'd embed the actual QR code image)
    const qrSize = 60;
    const qrX = pageWidth - margin - qrSize - 10;
    const qrY = sectionY + 10;
    
    pdf.rect(qrX, qrY, qrSize, qrSize);
    pdf.setFontSize(8);
    pdf.text('QR Code', qrX + qrSize/2, qrY + qrSize + 10, { align: 'center' } as any);

    // Instructions
    pdf.setFontSize(8);
    pdf.text('Scan with Shellff app', margin + 10, sectionY + 70);
    pdf.text('or enter code manually', margin + 10, sectionY + 80);

    codeCount++;
  });

  return Buffer.from(pdf.output('arraybuffer'));
}

export function generateCSV(
  codes: PDFCodeData[], 
  albumInfo: { title: string; artist: string }
): string {
  const safeAlbumInfo = {
    title: albumInfo.title || 'Unknown Album',
    artist: albumInfo.artist || 'Unknown Artist'
  };
  
  const headers = ['Code', 'Album Title', 'Artist', 'Generated Date', 'Status'];
  const rows = codes.map(codeData => [
    codeData.code,
    safeAlbumInfo.title,
    safeAlbumInfo.artist,
    new Date().toISOString(),
    'unused'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
