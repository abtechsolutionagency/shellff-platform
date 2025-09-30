import { join } from 'node:path';
import { prepareDefinition, writeFixture, type FixtureDefinition, type FixtureWriteResult } from './common';

const pngData = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YfTtHMAAAAASUVORK5CYII=',
  'base64',
);

const jpgData = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhIVFhUVFRUVFRUVFRUVFRUVFRUWFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGy0mICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIALcBEwMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAEAAIDBQYHBAj/xABDEAABAwIEAwUGBwYEBwAAAAABAAIRAwQFEiExBhNBURQiYXGBBhMyQrFCUmJyobEHFDRD0dEkYnKSwuHxFf/EABgBAQEBAQEAAAAAAAAAAAAAAAABAgME/8QAHxEBAQEAAQQDAAAAAAAAAAAAAQIRAyESMQRBURMi/9oADAMBAAIRAxEAPwD9EREBERAEREBERAEREBERAEREBERAEREBERAEREBERAEREBERAF//2Q==',
  'base64',
);

const svgData = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="#0f172a" />
    <text x="60" y="68" font-family="Inter, sans-serif" font-size="28" fill="#f8fafc" text-anchor="middle">
      Shellff
    </text>
  </svg>`,
  'utf8',
);

const IMAGE_FIXTURE_DEFINITIONS: readonly FixtureDefinition[] = [
  prepareDefinition({
    relativePath: join('images', 'cover.png'),
    description: '1x1 transparent PNG placeholder.',
    data: pngData,
  }),
  prepareDefinition({
    relativePath: join('images', 'cover.jpg'),
    description: '1x1 JPEG placeholder encoded from a deterministic base64 string.',
    data: jpgData,
  }),
  prepareDefinition({
    relativePath: join('images', 'barcode.svg'),
    description: 'Vector barcode placeholder rendered from inline SVG markup.',
    data: svgData,
  }),
] as const;

export const IMAGE_FIXTURES = IMAGE_FIXTURE_DEFINITIONS;

export async function writeImageFixtures(rootDir: string): Promise<FixtureWriteResult[]> {
  return Promise.all(IMAGE_FIXTURE_DEFINITIONS.map((definition) => writeFixture(rootDir, definition)));
}
