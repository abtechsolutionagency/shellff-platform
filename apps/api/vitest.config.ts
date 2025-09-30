import { defineConfig } from 'vitest/config';

export default defineConfig({
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
