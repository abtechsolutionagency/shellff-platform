import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AUDIO_FIXTURES, writeAudioFixtures } from '../../scripts/fixtures/audio';
import { IMAGE_FIXTURES, writeImageFixtures } from '../../scripts/fixtures/images';
import { FIXTURE_ROOT_DIR } from '../../scripts/fixtures/common';

describe('fixture generators', () => {
  const specDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(specDir, '..', '..', '..', '..');
  const fixtureRoot = join(repoRoot, FIXTURE_ROOT_DIR);

  it('writes deterministic audio fixtures into the shared fixtures directory', async () => {
    const results = await writeAudioFixtures(repoRoot);
    expect(results).toHaveLength(AUDIO_FIXTURES.length);

    for (const definition of AUDIO_FIXTURES) {
      const expectedRelative = join(FIXTURE_ROOT_DIR, definition.relativePath);
      const result = results.find((item) => item.relativePath === expectedRelative);
      expect(result, `Expected audio fixture for ${definition.relativePath}`).toBeDefined();
      expect(result!.absolutePath.startsWith(fixtureRoot)).toBe(true);
      expect(result!.size).toBe(definition.expectedSize);
      expect(result!.sha256).toBe(definition.expectedSha256);

      const fileBuffer = await readFile(result!.absolutePath);
      const hash = createHash('sha256').update(fileBuffer).digest('hex');
      expect(hash).toBe(definition.expectedSha256);
    }
  });

  it('writes deterministic image fixtures into the shared fixtures directory', async () => {
    const results = await writeImageFixtures(repoRoot);
    expect(results).toHaveLength(IMAGE_FIXTURES.length);

    for (const definition of IMAGE_FIXTURES) {
      const expectedRelative = join(FIXTURE_ROOT_DIR, definition.relativePath);
      const result = results.find((item) => item.relativePath === expectedRelative);
      expect(result, `Expected image fixture for ${definition.relativePath}`).toBeDefined();
      expect(result!.absolutePath.startsWith(fixtureRoot)).toBe(true);
      expect(result!.size).toBe(definition.expectedSize);
      expect(result!.sha256).toBe(definition.expectedSha256);

      const fileBuffer = await readFile(result!.absolutePath);
      const hash = createHash('sha256').update(fileBuffer).digest('hex');
      expect(hash).toBe(definition.expectedSha256);
    }
  });
});
