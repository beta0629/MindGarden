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
    /**
     * JSON 파일(i18n 번역 SSOT 등)은 ESLint 파서 대상에서 제외한다.
     * 검증이 필요하면 별도 스크립트 또는 ts-loader/json schema 로 처리.
     */
    '**/*.json',
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
        /**
         * i18n 정책 (A8, 2026-06-14): 신규 한국어 인라인 문자열 추가를 점진적으로 금지한다.
         * `src/i18n/translations/<lang>.json` 에 키를 정의하고 `useTranslation()` / `t()` 를 사용한다.
         *
         * <p>현재 인라인 한국어 약 20,718 라인이 존재하므로 본 규칙은 `warn` 으로 시작하여
         * 디자인 v2 와 병행해 점진적으로 마이그한다. 신규 코드에서 경고가 뜨면 i18n 키로 옮긴다.</p>
         *
         * <p>정책 문서: `docs/standards/EXPO_APP_I18N_POLICY.md`.</p>
         */
        {
          selector:
            'Literal[value=/[\\uAC00-\\uD7A3]/], TemplateElement[value.raw=/[\\uAC00-\\uD7A3]/], JSXText[value=/[\\uAC00-\\uD7A3]/]',
          message:
            '한국어 인라인 문자열 금지 — src/i18n/translations/ko.json 에 키를 정의하고 useTranslation()/t() 를 사용하세요.',
        },
      ],
    },
  },
  {
    /**
     * i18n 정책 제외 경로 — SSOT 번역 파일·테스트·표준 문서 인용·디버그 로그·앱 설정.
     *
     * <p>`src/i18n/translations/*.json` 은 한국어 SSOT 그 자체이므로 위반 대상이 아니다.
     * `app.config.ts`·`assets`·`scripts` 는 빌드 메타데이터·CLI 안내 문구로 사용자 가시 UI 가
     * 아니다.</p>
     */
    name: 'mindgarden/i18n-policy-allowlist',
    files: [
      'src/i18n/translations/**/*.json',
      'src/i18n/translations/**/*.ts',
      'src/i18n/index.ts',
      'src/i18n/__tests__/**/*.{ts,tsx}',
      'app.config.ts',
      'app.json',
      'eslint.config.js',
      'scripts/**/*.js',
      'scripts/**/*.ts',
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': 'off',
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
  {
    name: 'mindgarden/design-token-sources',
    /**
     * 디자인 토큰을 정의하는 SSOT 파일은 hex literal 사용이 허용된다.
     * - `src/theme/tokens.ts` : Expo 앱 색상 토큰
     * - `src/theme/tokensAppConfig.cjs` : Node 측 splash·notification 동기화
     * - `src/constants/oauthProviderBrand.ts` : OAuth 사업자 브랜드 색상
     */
    files: [
      'src/theme/tokens.ts',
      'src/theme/tokensAppConfig.cjs',
      'src/constants/oauthProviderBrand.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
