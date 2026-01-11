/**
 * Interface definitions for core system components
 * Defines the contracts between different parts of the system
 */

import { 
  UserConstraints, 
  UserConstraintUpdates,
  TechnicalOption, 
  EvaluationResult, 
  ComparisonOutput,
  UserSession 
} from './core';

/**
 * Interface for the Constraint Collector component
 * Responsible for capturing and validating user input
 */
export interface ConstraintCollector {
  /**
   * Validate user constraints
   * @param constraints - The constraints to validate
   * @returns Validation result with any errors
   */
  validateConstraints(constraints: UserConstraints): ValidationResult;

  /**
   * Normalize priority weights to ensure they sum appropriately
   * @param priorities - Priority weights to normalize
   * @returns Normalized priority weights
   */
  normalizePriorities(priorities: UserConstraints['priorities']): UserConstraints['priorities'];

  /**
   * Sanitize user input to prevent injection attacks
   * @param input - Raw user input
   * @returns Sanitized input
   */
  sanitizeInput(input: any): any;
}

/**
 * Interface for the Comparison Engine component
 * Responsible for evaluating technical options against criteria
 */
export interface ComparisonEngine {
  /**
   * Evaluate a set of technical options against user constraints
   * @param options - Technical options to evaluate (2-3 options)
   * @param constraints - User constraints and priorities
   * @returns Complete evaluation result
   */
  evaluate(options: TechnicalOption[], constraints: UserConstraints): EvaluationResult;

  /**
   * Validate that the number of options is within acceptable range (2-3)
   * @param options - Options to validate
   * @returns Validation result
   */
  validateOptionCount(options: TechnicalOption[]): ValidationResult;
}

/**
 * Interface for the Output Generator component
 * Responsible for formatting evaluation results into structured output
 */
export interface OutputGenerator {
  /**
   * Generate complete comparison output from evaluation results
   * @param result - Evaluation result to format
   * @param constraints - User constraints for context
   * @returns Formatted comparison output
   */
  generateComparison(result: EvaluationResult, constraints: UserConstraints): ComparisonOutput;

  /**
   * Generate alternative scenarios based on different priority configurations
   * @param result - Base evaluation result
   * @param constraints - Original constraints
   * @returns List of alternative scenarios
   */
  generateAlternativeScenarios(result: EvaluationResult, constraints: UserConstraints): ComparisonOutput['alternativeScenarios'];
}

/**
 * Interface for the Knowledge Base component
 * Responsible for providing domain-specific evaluation logic
 */
export interface KnowledgeBase {
  /**
   * Get evaluation criteria for a specific technology category
   * @param category - Technology category
   * @returns Evaluation criteria for the category
   */
  getCriteriaForCategory(category: TechnicalOption['category']): import('./knowledge').EvaluationCriteria[];

  /**
   * Get scoring rules for a specific technology category
   * @param category - Technology category
   * @returns Scoring rules for the category
   */
  getScoringRulesForCategory(category: TechnicalOption['category']): import('./knowledge').ScoringRule[];

  /**
   * Check if a technology is known in the knowledge base
   * @param option - Technical option to check
   * @returns True if known, false otherwise
   */
  isKnownTechnology(option: TechnicalOption): boolean;
}

/**
 * Interface for session management
 */
export interface SessionManager {
  /**
   * Create a new user session
   * @param constraints - Initial constraints
   * @returns New session
   */
  createSession(constraints: UserConstraints): UserSession;

  /**
   * Update an existing session with new constraints
   * @param sessionId - Session to update
   * @param constraints - New constraints
   * @returns Updated session
   */
  updateSession(sessionId: string, constraints: UserConstraints): UserSession;

  /**
   * Get a session by ID
   * @param sessionId - Session ID
   * @returns Session if found, null otherwise
   */
  getSession(sessionId: string): UserSession | null;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
  /** List of warnings (non-blocking) */
  warnings: string[];
}

/**
 * Validation error structure
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

/**
 * Interface for constraint update operations
 */
export interface ConstraintUpdateManager {
  /**
   * Update specific constraint fields and trigger re-evaluation
   * @param sessionId - Session to update
   * @param constraintUpdates - Partial constraint updates
   * @returns Updated evaluation result
   */
  updateConstraints(sessionId: string, constraintUpdates: UserConstraintUpdates): Promise<ConstraintUpdateResult>;

  /**
   * Update priorities and trigger re-evaluation
   * @param sessionId - Session to update
   * @param newPriorities - New priority weights
   * @returns Updated evaluation result
   */
  updatePriorities(sessionId: string, newPriorities: UserConstraints['priorities']): Promise<ConstraintUpdateResult>;

  /**
   * Get constraint modification history for a session
   * @param sessionId - Session to get history for
   * @returns Array of constraint modifications
   */
  getModificationHistory(sessionId: string): ConstraintModification[];

  /**
   * Validate constraint updates before applying
   * @param currentConstraints - Current constraint values
   * @param updates - Proposed updates
   * @returns Validation result
   */
  validateConstraintUpdates(currentConstraints: UserConstraints, updates: UserConstraintUpdates): ValidationResult;
}

/**
 * Result of a constraint update operation
 */
export interface ConstraintUpdateResult {
  /** Whether the update was successful */
  success: boolean;
  /** Updated constraints */
  updatedConstraints: UserConstraints;
  /** New evaluation result */
  evaluationResult: EvaluationResult | null;
  /** Validation errors if any */
  errors: ValidationError[];
  /** Warnings about the update */
  warnings: string[];
  /** Summary of what changed */
  changesSummary: string[];
}

/**
 * Record of a constraint modification
 */
export interface ConstraintModification {
  /** Timestamp of the modification */
  timestamp: Date;
  /** Fields that were modified */
  modifiedFields: string[];
  /** Previous values */
  previousValues: UserConstraintUpdates;
  /** New values */
  newValues: UserConstraintUpdates;
  /** Reason for the modification (if provided) */
  reason?: string;
}

/**
 * Configuration for the Technical Referee system
 */
export interface TechnicalRefereeConfig {
  /** Minimum number of options required for comparison */
  minOptions: number;
  /** Maximum number of options allowed for comparison */
  maxOptions: number;
  /** Default priority weights */
  defaultPriorities: UserConstraints['priorities'];
  /** Confidence threshold for recommendations */
  confidenceThreshold: number;
}