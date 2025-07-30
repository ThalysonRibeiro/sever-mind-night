// jest.config.cjs - versão atualizada
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        target: 'es2020'
      }
    }],
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/types/**',
    '!src/config/**',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  extensionsToTreatAsEsm: [],
};