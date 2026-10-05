/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.jest.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          strict: true,
          jsx: "react",
          module: "commonjs",
          moduleResolution: "node",
          target: "es2019",
          isolatedModules: true,
          skipLibCheck: true
        }
      }
    ]
  }
};
