// Test setup file - runs before all tests
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DISCORD_TOKEN = 'test_token_mock';
process.env.CLIENT_ID = 'test_client_id_mock';

// Create test data directory before tests run
const testDataDir = path.join(process.cwd(), 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}
process.env.DATA_PATH = testDataDir;

// Suppress console outputs during tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;

  // Clean up test data directory recursively
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
});
