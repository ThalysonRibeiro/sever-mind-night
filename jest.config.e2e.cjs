// jest.config.e2e.cjs - configuração específica para testes E2E
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/e2e'],
  testMatch: ['**/tests/e2e/**/*.e2e.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        target: 'es2020'
      }
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.e2e.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  extensionsToTreatAsEsm: [],
};