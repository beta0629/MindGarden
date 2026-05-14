'use strict';

/**
 * ESLint 9 flat config (이전 `.eslintrc.js` 규칙 이관).
 * @see https://docs.expo.dev/guides/using-eslint/
 */

const { defineConfig, globalIgnores } = require('eslint/config');
const expoFlat = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/.expo/**',
    'dist/**',
    'android/**',
    'ios/**',
    'coverage/**',
  ]),
  ...expoFlat,
  eslintPluginPrettierRecommended,
  {
    name: 'mindgarden/legacy-eslintrc-parity',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'prettier/prettier': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: '색상 하드코딩 금지 — theme 토큰을 사용하세요.',
        },
      ],
    },
  },
  {
    name: 'mindgarden/typescript-import-resolver',
    files: ['**/*.{ts,tsx}'],
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
  {
    name: 'mindgarden/node-config-files',
    files: [
      'babel.config.js',
      'metro.config.js',
      'app.config.ts',
      'plugins/**/*.js',
      'src/theme/tokensAppConfig.cjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    name: 'mindgarden/cli-scripts',
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
]);
