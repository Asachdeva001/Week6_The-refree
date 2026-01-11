/**
 * Jest test setup file
 * Configures global test settings and utilities
 */

// Configure fast-check for property-based testing
import fc from 'fast-check';

// Set default number of runs for property-based tests
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations as specified in design
  verbose: false,
  seed: 42, // Fixed seed for reproducible tests in CI
});

// Global test utilities can be added here
declare global {
  namespace jest {
    interface Matchers<R> {
      // Custom matchers can be added here if needed
    }
  }
}

export {};