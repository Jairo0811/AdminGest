module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts', '!src/**/*.module.ts'],
  coverageDirectory: 'coverage',
  // Business rules with unit coverage targets (tenant/DB rules are covered by the
  // SQL Server integration suite, see docs/TESTING.md).
  coverageThreshold: {
    './src/modules/quotes/quote-calculator.ts': { lines: 95, branches: 85 },
    './src/modules/subscriptions/subscription-limits.ts': { lines: 95 },
    './src/modules/users/user-policy.ts': { lines: 95 },
    './src/modules/auth/session-tokens.ts': { lines: 90 },
  },
  testEnvironment: 'node',
};
