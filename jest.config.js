module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest'],
  },
  globals: {
    'ts-jest': {
      // speeds up tests execution, but doesn't check types definition for tests
      // which is fine, because it's checked anyway with ESLint and yarn run check-types
      isolatedModules: true,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
};
