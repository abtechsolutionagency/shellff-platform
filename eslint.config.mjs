import path from 'node:path';
import { fileURLToPath } from 'node:url';

import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  fetch: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  Headers: 'readonly',
  FormData: 'readonly',
  File: 'readonly',
  Blob: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly'
};

const nodeGlobals = {
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  global: 'readonly',
  console: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  module: 'readonly',
  require: 'readonly',
  exports: 'readonly'
};

const vitestGlobals = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  test: 'readonly',
  vi: 'readonly'
};

export default [
  {
    name: 'root-ignores',
    ignores: [
      '**/node_modules/**',
      '**/.expo/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**'
    ]
  },
  {
    name: 'javascript',
    files: ['**/*.{js,jsx,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      ...eslint.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'prefer-const': 'error'
    }
  },
  {
    name: 'typescript',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: [
          path.join(__dirname, 'apps/api/tsconfig.json'),
          path.join(__dirname, 'apps/web/tsconfig.json'),
          path.join(__dirname, 'apps/mobile/tsconfig.json')
        ]
      },
      sourceType: 'module'
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off',
      'import/order': 'off',
      'prefer-const': 'error'
    }
  },
  {
    name: 'react',
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin
    },
    languageOptions: {
      globals: browserGlobals
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unknown-property': 'off',
      'react/prop-types': 'off'
    }
  },
  {
    name: 'next',
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      '@next/next': nextPlugin
    },
    settings: {
      next: {
        rootDir: ['apps/web']
      }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off'
    }
  },
  {
    name: 'mobile-globals',
    files: ['apps/mobile/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...browserGlobals,
        __DEV__: 'readonly'
      }
    }
  },
  {
    name: 'node-configs',
    files: [
      '**/*.config.{js,ts}',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/babel.config.js',
      '**/metro.config.js',
      '**/scripts/**/*.{js,ts}',
      '**/test-slice2-functionality.js',
      '**/fix_wallet_auth.js'
    ],
    languageOptions: {
      globals: nodeGlobals
    },
    rules: {
      'no-unused-vars': 'off'
    }
  },
  {
    name: 'service-worker',
    files: ['**/public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        MediaMetadata: 'readonly',
        URL: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'prefer-const': 'off'
    }
  },
  {
    name: 'node',
    files: [
      'apps/api/**/*.{ts,tsx,js,jsx}',
      'infra/**/*.{ts,js}',
      'scripts/**/*.{ts,js}'
    ],
    languageOptions: {
      globals: nodeGlobals
    },
    rules: {
      'no-unused-vars': 'off'
    }
  },
  {
    name: 'vitest',
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}'
    ],
    languageOptions: {
      globals: {
        ...vitestGlobals,
        ...nodeGlobals,
        ...browserGlobals
      }
    }
  },
  {
    name: 'prettier',
    ...eslintConfigPrettier
  }
];
