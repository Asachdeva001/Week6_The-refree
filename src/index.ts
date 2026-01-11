/**
 * Technical Referee Tool - Main Entry Point
 * A decision-support system for comparing technical options
 */

import { UserConstraints, TechnicalOption } from './types';
import { ConstraintCollectionInterface } from './components/ConstraintCollectionInterface';
import { SimpleHTTPServer } from './web/server';

/**
 * Main Technical Referee class
 * Orchestrates the comparison process from constraint collection to recommendation output
 */
export class TechnicalReferee {
  private config = {
    minOptions: 2,
    maxOptions: 3,
    defaultPriorities: {
      cost: 3,
      performance: 3,
      easeOfUse: 3,
      scalability: 3,
      vendorLockIn: 3,
    },
    confidenceThreshold: 0.7,
  };

  private constraintInterface: ConstraintCollectionInterface;

  constructor() {
    this.constraintInterface = new ConstraintCollectionInterface();
  }

  /**
   * Get the current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get the constraint collection interface
   */
  getConstraintInterface(): ConstraintCollectionInterface {
    return this.constraintInterface;
  }

  /**
   * Start the web interface for constraint collection
   */
  startWebInterface(port: number = 3000): SimpleHTTPServer {
    const server = new SimpleHTTPServer(port);
    server.start();
    return server;
  }

  /**
   * Placeholder method for the main comparison workflow
   * Will be implemented in subsequent tasks
   */
  async compareOptions(options: TechnicalOption[], constraints: UserConstraints) {
    // Validate inputs
    if (options.length < this.config.minOptions || options.length > this.config.maxOptions) {
      throw new Error(`Must provide between ${this.config.minOptions} and ${this.config.maxOptions} options`);
    }

    // TODO: Implement full comparison logic in subsequent tasks
    console.log('Technical Referee initialized successfully');
    console.log(`Comparing ${options.length} options with constraints:`, constraints);
    
    return {
      message: 'Comparison logic will be implemented in subsequent tasks',
      options: options.map(o => o.name),
      constraints,
    };
  }
}

// Export main class and types
export * from './types';
export * from './components/ConstraintCollectionInterface';
export { KnowledgeBase } from './components/KnowledgeBase';
export { ConstraintUpdateManagerImpl } from './components/ConstraintUpdateManager';
export * from './web/server';
export default TechnicalReferee;