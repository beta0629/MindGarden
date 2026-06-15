/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src/utils/__tests__',
    '<rootDir>/src/services/auth/__tests__',
    '<rootDir>/src/services/__tests__',
    '<rootDir>/src/stores/__tests__',
    '<rootDir>/src/api/auth/__tests__',
    '<rootDir>/src/api/hooks/__tests__',
    '<rootDir>/src/components/molecules/__tests__',
    '<rootDir>/src/components/organisms/login/__tests__',
    '<rootDir>/src/i18n/__tests__',
  ],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          strict: true,
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] },
          resolveJsonModule: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
