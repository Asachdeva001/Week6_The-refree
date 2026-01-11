/**
 * Main type exports for the Technical Referee Tool
 * Provides a single entry point for all type definitions
 */

// Core types
export * from './core';

// Knowledge base types
export * from './knowledge';

// Interface definitions
export * from './interfaces';

// Re-export commonly used types for convenience
export type {
  UserConstraints,
  UserConstraintUpdates,
  TechnicalOption,
  EvaluationResult,
  ComparisonOutput,
  Recommendation,
  OptionScore,
  TradeOffAnalysis,
} from './core';

export type {
  ComparisonEngine,
  ConstraintCollector,
  OutputGenerator,
  KnowledgeBase,
  ConstraintUpdateManager,
  ValidationResult,
  ConstraintUpdateResult,
  ConstraintModification,
} from './interfaces';

export type {
  DomainKnowledge,
  EvaluationCriteria,
  StandardCriterion,
} from './knowledge';