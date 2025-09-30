#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { closeSync, openSync, readSync } from 'node:fs';
import { join, extname } from 'node:path';
import process from 'node:process';

const BINARY_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.jpg', '.jpeg', '.png', '.svg']);
const ALLOWLIST = new Set(['POST_MVP_FEATURES.pdf']);

function resolveRepositoryRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    console.error('Unable to determine repository root. Are you inside a git repository?');
    throw error;
  }
}

function listTrackedFiles(repoRoot) {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      cwd: repoRoot,
      encoding: 'buffer',
    });
    return output
      .toString('utf8')
      .split('\u0000')
      .filter(Boolean);
  } catch (error) {
    console.error('Failed to enumerate tracked files via git ls-files.');
    throw error;
  }
}

function isBinaryFile(absolutePath) {
  let fd;
  try {
    fd = openSync(absolutePath, 'r');
    const sampleLength = 4096;
    const buffer = Buffer.alloc(sampleLength);
    const bytesRead = readSync(fd, buffer, 0, sampleLength, 0);
    if (bytesRead === 0) {
      return false;
    }

    for (let index = 0; index < bytesRead; index += 1) {
      if (buffer[index] === 0) {
        return true;
      }
    }

    const textSample = buffer.slice(0, bytesRead).toString('utf8');
    if (textSample.includes('\uFFFD')) {
      return true;
    }

    let controlCharacters = 0;
    for (let index = 0; index < bytesRead; index += 1) {
      const value = buffer[index];
      if (value < 32 && value !== 9 && value !== 10 && value !== 13) {
        controlCharacters += 1;
        if (controlCharacters > 5) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error(`Unable to inspect file at ${absolutePath}`);
    throw error;
  } finally {
    if (fd !== undefined) {
      closeSync(fd);
    }
  }
}

function main() {
  const repoRoot = resolveRepositoryRoot();
  const trackedFiles = listTrackedFiles(repoRoot);
  const offenders = [];

  for (const relativePath of trackedFiles) {
    if (ALLOWLIST.has(relativePath)) {
      continue;
    }

    const extension = extname(relativePath).toLowerCase();
    if (BINARY_EXTENSIONS.has(extension)) {
      offenders.push({ path: relativePath, reason: `extension ${extension}` });
      continue;
    }

    const absolutePath = join(repoRoot, relativePath);
    if (isBinaryFile(absolutePath)) {
      offenders.push({ path: relativePath, reason: 'binary content detected' });
    }
  }

  if (offenders.length > 0) {
    console.error('Binary files detected in the git index:');
    for (const offender of offenders) {
      console.error(` - ${offender.path} (${offender.reason})`);
    }
    console.error('Binary assets must be produced via generate:fixtures and kept out of the repository.');
    process.exit(1);
  }

  console.log('✓ No tracked binary assets detected.');
}

main();
