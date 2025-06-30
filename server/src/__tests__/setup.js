// Test setup file for Jest
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities can be added here
global.testUtils = {
  // Add any global test utilities here
};
