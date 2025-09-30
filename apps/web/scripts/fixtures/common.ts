import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const FIXTURE_ROOT_DIR = 'fixtures';

export type RawFixtureDefinition = {
  relativePath: string;
  description: string;
  data: Buffer;
};

export type FixtureDefinition = RawFixtureDefinition & {
  expectedSha256: string;
  expectedSize: number;
};

export type FixtureWriteResult = {
  relativePath: string;
  absolutePath: string;
  size: number;
  sha256: string;
};

export function prepareDefinition(definition: RawFixtureDefinition): FixtureDefinition {
  const expectedSha256 = createHash('sha256').update(definition.data).digest('hex');
  return Object.freeze({
    ...definition,
    expectedSha256,
    expectedSize: definition.data.length,
  });
}

export async function writeFixture(rootDir: string, definition: FixtureDefinition): Promise<FixtureWriteResult> {
  const absolutePath = join(rootDir, FIXTURE_ROOT_DIR, definition.relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, definition.data);

  return {
    relativePath: join(FIXTURE_ROOT_DIR, definition.relativePath),
    absolutePath,
    size: definition.expectedSize,
    sha256: definition.expectedSha256,
  };
}
