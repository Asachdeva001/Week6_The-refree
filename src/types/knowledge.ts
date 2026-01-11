/**
 * Knowledge base type definitions
 * Defines structures for domain-specific evaluation criteria and scoring logic
 */

import { TechnicalOption } from './core';

/**
 * Domain-specific knowledge for a technology category
 */
export interface DomainKnowledge {
  /** Technology category */
  category: string;
  /** Evaluation criteria for this domain */
  criteria: EvaluationCriteria[];
  /** Scoring rules for this domain */
  scoringRules: ScoringRule[];
}

/**
 * A single evaluation criterion
 */
export interface EvaluationCriteria {
  /** Name of the criterion */
  name: string;
  /** Base weight for this criterion */
  weight: number;
  /** Function to score an option on this criterion */
  scoringFunction: (option: TechnicalOption) => number;
  /** Description of what this criterion measures */
  description: string;
}

/**
 * A scoring rule that maps option characteristics to scores
 */
export interface ScoringRule {
  /** Name of the rule */
  name: string;
  /** Condition that must be met for this rule to apply */
  condition: (option: TechnicalOption) => boolean;
  /** Score adjustment when condition is met */
  scoreAdjustment: number;
  /** Criteria this rule affects */
  affectedCriteria: string[];
}

/**
 * Cloud provider specific data structure
 */
export interface CloudProviderData {
  /** Provider name */
  name: string;
  /** Pricing model type */
  pricingModel: 'pay-as-you-go' | 'reserved' | 'hybrid';
  /** Number of available services */
  serviceCount: number;
  /** List of enterprise features */
  enterpriseFeatures: string[];
  /** Learning curve difficulty */
  learningCurve: 'low' | 'medium' | 'high';
  /** Market share percentage */
  marketShare: number;
  /** Geographic regions available */
  regions: number;
  /** Compliance certifications */
  certifications: string[];
}

/**
 * Backend framework specific data structure
 */
export interface BackendFrameworkData {
  /** Framework name */
  name: string;
  /** Programming language */
  language: string;
  /** Development speed rating (1-10) */
  developmentSpeed: number;
  /** Community size (GitHub stars, Stack Overflow questions, etc.) */
  communitySize: number;
  /** Enterprise adoption rating (1-10) */
  enterpriseAdoption: number;
  /** Performance rating (1-10) */
  performanceRating: number;
  /** Learning curve difficulty */
  learningCurve: 'low' | 'medium' | 'high';
  /** Available packages/libraries */
  packageEcosystem: number;
}

/**
 * Database specific data structure
 */
export interface DatabaseData {
  /** Database name */
  name: string;
  /** Database type */
  type: 'relational' | 'document' | 'key-value' | 'graph' | 'columnar';
  /** Schema flexibility */
  schemaFlexibility: 'rigid' | 'flexible' | 'schemaless';
  /** Query language complexity */
  queryComplexity: 'simple' | 'moderate' | 'complex';
  /** Horizontal scaling capability */
  horizontalScaling: 'poor' | 'good' | 'excellent';
  /** Consistency model */
  consistencyModel: 'strong' | 'eventual' | 'configurable';
  /** ACID compliance */
  acidCompliance: boolean;
  /** Performance rating (1-10) */
  performanceRating: number;
}

/**
 * Standard evaluation criteria names used across all domains
 */
export const STANDARD_CRITERIA = {
  COST: 'cost',
  PERFORMANCE: 'performance',
  SCALABILITY: 'scalability',
  LEARNING_CURVE: 'learningCurve',
  VENDOR_LOCK_IN: 'vendorLockIn',
  MAINTAINABILITY: 'maintainability',
} as const;

/**
 * Type for standard criteria keys
 */
export type StandardCriterion = typeof STANDARD_CRITERIA[keyof typeof STANDARD_CRITERIA];