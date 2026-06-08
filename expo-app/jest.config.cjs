/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src/utils/__tests__',
    '<rootDir>/src/services/auth/__tests__',
    '<rootDir>/src/services/__tests__',
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
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
