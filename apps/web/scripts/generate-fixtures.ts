import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeAudioFixtures } from './fixtures/audio';
import { writeImageFixtures } from './fixtures/images';

async function run(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(scriptDir, '..', '..', '..');

  const [audioResults, imageResults] = await Promise.all([
    writeAudioFixtures(repoRoot),
    writeImageFixtures(repoRoot),
  ]);

  const totalGenerated = audioResults.length + imageResults.length;
  const paths = [...audioResults, ...imageResults].map((item) => item.relativePath).sort();

  console.log(`Generated ${totalGenerated} deterministic fixtures:`);
  for (const relativePath of paths) {
    console.log(` - ${relativePath}`);
  }
}

run().catch((error) => {
  console.error('Failed to generate fixtures');
  console.error(error);
  process.exit(1);
});
