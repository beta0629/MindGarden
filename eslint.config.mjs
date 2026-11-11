import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.open-next/**',
    '.wrangler/**',
    'node_modules/**',
    'frontend/**',
    'scripts/**',
    'api.js',
    'config.js',
    'script.js',
    'ecosystem.homepage.config.cjs',
    'out/**',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]);
