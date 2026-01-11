/**
 * Core type definitions for the Technical Referee Tool
 * These interfaces define the fundamental data structures used throughout the system
 */

/**
 * User constraints that define the context for technology comparison
 * Captures budget, scale, team capabilities, timeline, and priorities
 */
export interface UserConstraints {
  /** Budget level for the project */
  budget: 'low' | 'medium' | 'high';
  
  /** Expected scale and usage patterns */
  scale: {
    /** Expected number of users */
    users: number;
    /** Expected traffic volume */
    traffic: 'low' | 'medium' | 'high';
  };
  
  /** Team context and capabilities */
  team: {
    /** Overall skill level of the team */
    skillLevel: 'junior' | 'mixed' | 'senior';
    /** Technologies the team has experience with */
    experience: string[];
  };
  
  /** Time-to-market requirements */
  timeline: 'immediate' | 'short' | 'medium' | 'long';
  
  /** Priority weights for different criteria (1-5 scale) */
  priorities: {
    /** Cost optimization priority */
    cost: number;
    /** Performance optimization priority */
    performance: number;
    /** Ease of use priority */
    easeOfUse: number;
    /** Scalability priority */
    scalability: number;
    /** Vendor lock-in avoidance priority (higher = more important to avoid) */
    vendorLockIn: number;
  };
}

/**
 * Flexible constraint updates that allow partial nested objects
 */
export type UserConstraintUpdates = {
  budget?: UserConstraints['budget'];
  scale?: Partial<UserConstraints['scale']>;
  team?: Partial<UserConstraints['team']>;
  timeline?: UserConstraints['timeline'];
  priorities?: Partial<UserConstraints['priorities']>;
};

/**
 * A technical option being evaluated (e.g., AWS, PostgreSQL, Node.js)
 */
export interface TechnicalOption {
  /** Name of the technology */
  name: string;
  /** Category of technology for domain-specific evaluation */
  category: 'cloud' | 'backend' | 'database' | 'frontend';
  /** Additional metadata for scoring */
  metadata: Record<string, any>;
}

/**
 * Score for a single option across all criteria
 */
export interface OptionScore {
  /** The option being scored */
  option: TechnicalOption;
  /** Scores for individual criteria */
  criteriaScores: Record<string, number>;
  /** Final weighted score */
  weightedScore: number;
  /** Normalized score on 0-100 scale */
  normalizedScore: number;
}

/**
 * Ranked option with position information
 */
export interface RankedOption {
  /** The option */
  option: TechnicalOption;
  /** Ranking position (1 = best) */
  rank: number;
  /** Final score */
  score: number;
}

/**
 * Analysis of trade-offs between options
 */
export interface TradeOffAnalysis {
  /** Which option is strongest for each criterion */
  strongestOption: Record<string, TechnicalOption>;
  /** Which option is weakest for each criterion */
  weakestOption: Record<string, TechnicalOption>;
  /** List of compromises when choosing each option */
  compromises: Compromise[];
}

/**
 * A compromise that must be made when choosing an option
 */
export interface Compromise {
  /** Description of the compromise */
  description: string;
  /** Impact level of the compromise */
  impact: 'low' | 'medium' | 'high';
  /** Criteria affected by this compromise */
  affectedCriteria: string[];
}

/**
 * Complete evaluation result
 */
export interface EvaluationResult {
  /** Scores for all options */
  scores: OptionScore[];
  /** Options ranked by score */
  rankings: RankedOption[];
  /** Trade-off analysis */
  tradeOffs: TradeOffAnalysis;
}

/**
 * Final recommendation with reasoning
 */
export interface Recommendation {
  /** The recommended option */
  recommendedOption: TechnicalOption;
  /** Confidence level (0-1 scale) */
  confidence: number;
  /** Explanation of why this option was chosen */
  reasoning: string;
  /** Key factors that influenced the decision */
  keyFactors: string[];
  /** Warnings or considerations */
  warnings: string[];
}

/**
 * Alternative scenario description
 */
export interface AlternativeScenario {
  /** Description of the scenario */
  scenario: string;
  /** Recommended option for this scenario */
  recommendedOption: TechnicalOption;
  /** Explanation of why this option is better for this scenario */
  reasoning: string;
}

/**
 * Pros and cons for a specific option
 */
export interface ProsCons {
  /** The option these pros/cons apply to */
  option: TechnicalOption;
  /** List of advantages */
  pros: string[];
  /** List of disadvantages */
  cons: string[];
}

/**
 * Comparison table data structure
 */
export interface ComparisonTable {
  /** Column headers (criteria names) */
  headers: string[];
  /** Rows of data, one per option */
  rows: ComparisonTableRow[];
}

/**
 * Single row in comparison table
 */
export interface ComparisonTableRow {
  /** The option this row represents */
  option: TechnicalOption;
  /** Values for each criterion */
  values: Record<string, string | number>;
}

/**
 * Complete comparison output
 */
export interface ComparisonOutput {
  /** Side-by-side comparison table */
  comparisonTable: ComparisonTable;
  /** Pros and cons for each option */
  prosAndCons: ProsCons[];
  /** Trade-off explanation */
  tradeOffExplanation: string;
  /** Final recommendation */
  finalRecommendation: Recommendation;
  /** Alternative scenarios */
  alternativeScenarios: AlternativeScenario[];
}

/**
 * User session data
 */
export interface UserSession {
  /** Unique session identifier */
  id: string;
  /** User's constraints */
  constraints: UserConstraints;
  /** Selected options for comparison */
  selectedOptions: TechnicalOption[];
  /** History of evaluations */
  evaluationHistory: EvaluationResult[];
  /** Session creation timestamp */
  createdAt: Date;
}