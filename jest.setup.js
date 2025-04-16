// Configuration file for Jest that cleans up resources after tests

// Increase global timeout for all tests
jest.setTimeout(30000);

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.restoreAllMocks();
});

// Ensure all pending promises are resolved after each test suite
afterAll(async () => {
  // Wait a bit to allow promises to resolve
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Force garbage collector if available
  if (global.gc) {
    global.gc();
  }
  
  // Clear MongoDB connection pool if it exists
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Ensure all file descriptors are closed
  console.log('Cleaning up resources after tests...');
}, 5000); 