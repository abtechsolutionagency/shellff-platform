#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIRECTORY = resolve(__dirname, '../fixtures/binaries');
const MANIFEST_PATH = resolve(OUTPUT_DIRECTORY, 'manifest.json');

const BINARY_FIXTURES = [
  {
    fileName: 'prism.bin',
    description: 'Seeded spectral noise sample for color-mapping tests.',
    base64:
      '9KaSYntOLKAhzkBc838hZUt6eN05BRi3ep4edgfeLT4lBCMmarVN/CSSV68vYbOkKYBIndN0US9nJI1GlPn87lex77TvLmfXHjWkDrzVojvFj19wTTqfb7GkkL+Kmv/e',
  },
  {
    fileName: 'lattice.bin',
    description: 'Pseudo-random lattice weights used by queue scheduling specs.',
    base64:
      'nouftvr2MZX4B+pqXPk75f9Qq3qcrDeAvGvnZq6PEXlg/6+GkhH6zEBh19NSBSUMNX4xpBS4ulGesH4NTPhg/DzqvVJyp1TFIUQfYRGNbD/5Facd8o3SHjv/2ZnFKQ7z',
  },
  {
    fileName: 'glacier.bin',
    description: 'Compact PCM envelope approximating a frozen pad swell.',
    base64:
      'j0CjpRWEIjOhYk/HXaTGO+U1ULmH1MkLmgGSrAIuPI+GTpwMDBedy5J1wqut9476SBHTLNiwikMB0IXpdXuLFxoAkWEzjtcC8ugcdU5SQuGQy5zREPSfon6mqJHY4+ie',
  },
  {
    fileName: 'ember.bin',
    description: 'High-contrast glitch burst for resilience testing.',
    base64:
      'fkRXgiXTpwYZQOzHArA9R7Ug0e2+mJxEUnWuUIPfpYK6outajKCtVXcwlO3LKrMDscg2/TykoltG01dlI7bc2GlfLvOy9Uqua2VJBdVuiEz1H7KHw05/gUt0qDJtOMTR',
  },
];

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

async function writeBinaryFixture(definition) {
  const { fileName, base64 } = definition;
  const outputPath = resolve(OUTPUT_DIRECTORY, fileName);
  const buffer = Buffer.from(base64, 'base64');
  await fs.writeFile(outputPath, buffer);
  return { ...definition, bytesWritten: buffer.length };
}

async function writeManifest(entries) {
  const manifest = entries.map(({ base64, ...rest }) => rest);
  const content = `${JSON.stringify({ generatedAt: new Date().toISOString(), fixtures: manifest }, null, 2)}\n`;
  await fs.writeFile(MANIFEST_PATH, content, 'utf8');
}

async function main() {
  await ensureDirectory(OUTPUT_DIRECTORY);
  const results = [];
  for (const definition of BINARY_FIXTURES) {
    const entry = await writeBinaryFixture(definition);
    results.push(entry);
  }

  await writeManifest(results);
  console.log(`Generated ${results.length} binary fixtures in ${OUTPUT_DIRECTORY}.`);
  for (const result of results) {
    console.log(` - ${result.fileName}: ${result.bytesWritten} bytes`);
  }
}

main().catch((error) => {
  console.error('Failed to generate binary fixtures.');
  console.error(error);
  process.exit(1);
});
