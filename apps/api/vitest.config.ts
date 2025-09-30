import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@nestjs/throttler': path.resolve(
        __dirname,
        '../..',
        'packages/nest-throttler/index.js',
      ),
      '@shellff/config': path.resolve(
        __dirname,
        '../..',
        'packages/config',
      ),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    setupFiles: ['reflect-metadata', './test/utils/register-metadata.ts'],
  },
  esbuild: {
    target: 'es2019',
    tsconfigRaw: {
      compilerOptions: {
        module: 'commonjs',
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
});
