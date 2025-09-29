import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    passWithNoTests: true
  }
});
