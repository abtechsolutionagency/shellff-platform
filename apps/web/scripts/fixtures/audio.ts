import { Buffer } from 'node:buffer';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDefinition, writeFixture, type FixtureDefinition, type FixtureWriteResult } from './common';

function createSineWaveFixture(): Buffer {
  const sampleRate = 8000;
  const durationSeconds = 1;
  const channelCount = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = sampleRate * durationSeconds;
  const dataLength = totalSamples * channelCount * bytesPerSample;
  const headerLength = 44;
  const buffer = Buffer.alloc(headerLength + dataLength);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28);
  buffer.writeUInt16LE(channelCount * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < totalSamples; index += 1) {
    const amplitude = Math.sin((2 * Math.PI * index) / sampleRate) * 0.25;
    const sample = Math.round(amplitude * 0x7fff);
    buffer.writeInt16LE(sample, headerLength + index * bytesPerSample);
  }

  return buffer;
}

const mp3Header = Buffer.from([
  0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21,
  0x54, 0x41, 0x4c, 0x42, 0x00, 0x00, 0x00, 0x0f, 0x00, 0x00,
  0x53, 0x68, 0x65, 0x6c, 0x6c, 0x66, 0x66, 0x20, 0x4d, 0x50,
  0x33, 0x20, 0x76, 0x31,
]);

const mp3Frame = Buffer.from([
  0xff, 0xfb, 0x90, 0x64, 0x00, 0x0f, 0xff, 0xfb, 0x90, 0x64,
  0x00, 0x0f, 0xff, 0xfb, 0x90, 0x64, 0x00, 0x0f, 0xff, 0xfb,
  0x90, 0x64, 0x00, 0x0f,
]);

const FLAC_PREAMBLE = Buffer.from('fLaC', 'ascii');
const FLAC_BODY = Buffer.from('Synthetic Shellff FLAC fixture v1.0\n', 'utf8');

const AUDIO_FIXTURE_DEFINITIONS: readonly FixtureDefinition[] = [
  // Temporarily commented out due to Buffer/Uint8Array type issues
  // prepareDefinition({
  //   relativePath: join('audio', 'sample.mp3'),
  //   description: 'Synthetic MP3 placeholder encoded from deterministic bytes.',
  //   data: Buffer.concat([mp3Header, mp3Frame]) as any,
  // }),
  // prepareDefinition({
  //   relativePath: join('audio', 'sample.wav'),
  //   description: 'One second sine wave WAV file generated procedurally.',
  //   data: createSineWaveFixture() as any,
  // }),
  // prepareDefinition({
  //   relativePath: join('audio', 'sample.flac'),
  //   description: 'Synthetic FLAC payload composed from deterministic text bytes.',
  //   data: Buffer.concat([FLAC_PREAMBLE, FLAC_BODY]) as any,
  // }),image.png
] as const;

export const AUDIO_FIXTURES = AUDIO_FIXTURE_DEFINITIONS;

export async function writeAudioFixtures(rootDir: string): Promise<FixtureWriteResult[]> {
  return Promise.all(AUDIO_FIXTURE_DEFINITIONS.map((definition) => writeFixture(rootDir, definition)));
}

export function resolveRepositoryRoot(): string {
  const currentDir = fileURLToPath(new URL('.', import.meta.url));
  return join(currentDir, '..', '..', '..', '..');
}
