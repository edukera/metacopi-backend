// Configuration file for Jest that cleans up resources after tests

// Increase global timeout for all tests
jest.setTimeout(30000);

// Supprimer les logs de console pendant les tests pour éviter les sorties d'erreur indésirables
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Remplacer par des fonctions mock
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

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
  
  // Restaurer les fonctions console d'origine
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  
  // Ensure all file descriptors are closed
  // console.log('Cleaning up resources after tests...');
}, 5000); 