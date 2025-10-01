import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup-tests.ts'],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['pwa-tests/**', '**/node_modules/**', '**/.pnpm/**'],
    passWithNoTests: true
  },
  resolve: {
    alias: {
      '@': appRoot,
    },
  },
});
