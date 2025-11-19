// Jest configuration for ES modules and Discord.js testing
export default {
  // Use node test environment for Discord bot testing
  testEnvironment: 'node',

  // Transform ES modules for Jest compatibility
  transform: {},
  
  // File extensions to test
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude main entry point
    '!src/utils/colors.js', // Exclude utility logger
    '!**/node_modules/**'
  ],

  // Coverage thresholds (production-ready thresholds)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 70,
      statements: 70
    }
  },

  // Verbose test output
  verbose: true,

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout (increase for file I/O operations)
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
