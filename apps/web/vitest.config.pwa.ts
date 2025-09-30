import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup-tests.ts'],
    include: ['pwa-tests/**/*.spec.{ts,tsx}'],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, '.'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
});
