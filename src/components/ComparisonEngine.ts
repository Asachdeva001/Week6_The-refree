/**
 * Comparison Engine Component
 * Responsible for evaluating technical options against user constraints
 * Implements Requirements 2.1, 2.2, 2.3, 2.4
 */

import { 
  UserConstraints, 
  TechnicalOption, 
  EvaluationResult,
  OptionScore,
  RankedOption,
  TradeOffAnalysis,
  Compromise,
  ComparisonEngine as IComparisonEngine,
  ValidationResult,
  ValidationError 
} from '../types';
import { KnowledgeBase } from './KnowledgeBase';
import { STANDARD_CRITERIA } from '../types/knowledge';

/**
 * Implementation of the Comparison Engine interface
 * Handles option validation, scoring, and ranking
 */
export class ComparisonEngine implements IComparisonEngine {
  private knowledgeBase: KnowledgeBase;

  constructor(knowledgeBase?: KnowledgeBase) {
    this.knowledgeBase = knowledgeBase || new KnowledgeBase();
  }

  /**
   * Validate that the number of options is within acceptable range (2-3)
   * Requirement 2.1: Accept 2-3 technical options for evaluation
   * @param options - Options to validate
   * @returns Validation result
   */
  validateOptionCount(options: TechnicalOption[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(options)) {
      errors.push({
        field: 'options',
        message: 'Options must be an array',
        code: 'OPTIONS_INVALID_TYPE',
      });
      return { isValid: false, errors, warnings };
    }

    if (options.length < 2) {
      errors.push({
        field: 'options',
        message: 'At least 2 options are required for comparison',
        code: 'OPTIONS_TOO_FEW',
      });
    } else if (options.length > 3) {
      errors.push({
        field: 'options',
        message: 'Maximum 3 options allowed for comparison',
        code: 'OPTIONS_TOO_MANY',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate and process technical options
   * Ensures options have required fields and valid metadata
   * @param options - Technical options to validate
   * @returns Validation result with detailed errors
   */
  // validateTechnicalOptions(options: TechnicalOption[]): ValidationResult {
  //   const errors: ValidationError[] = [];
  //   const warnings: string[] = [];

    // First validate option count
    const countValidation = this.validateOptionCount(options);
    errors.push(...countValidation.errors);
    warnings.push(...countValidation.warnings);

    // If count validation failed, don't proceed with individual option validation
    if (!countValidation.isValid) {
      return { isValid: false, errors, warnings };
    }

    // Validate each individual option
    options.forEach((option, index) => {
      const optionValidation = this.validateSingleOption(option, index);
      errors.push(...optionValidation.errors);
      warnings.push(...optionValidation.warnings);
    });

    // Check for duplicate options
    const duplicateValidation = this.validateNoDuplicates(options);
    errors.push(...duplicateValidation.errors);
    warnings.push(...duplicateValidation.warnings);

    // Check for category consistency
    const categoryValidation = this.validateCategoryConsistency(options);
    errors.push(...categoryValidation.errors);
    warnings.push(...categoryValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single technical option
   * @param option - Option to validate
   * @param index - Index in the options array for error reporting
   * @returns Validation result
   */
  private validateSingleOption(option: TechnicalOption, index: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!option) {
      errors.push({
        field: `options[${index}]`,
        message: 'Option cannot be null or undefined',
        code: 'OPTION_NULL',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate name
    if (typeof option.name !== 'string') {
      errors.push({
        field: `options[${index}].name`,
        message: 'Option name is required and must be a string',
        code: 'OPTION_NAME_INVALID',
      });
    } else if (option.name.trim().length === 0) {
      errors.push({
        field: `options[${index}].name`,
        message: 'Option name cannot be empty',
        code: 'OPTION_NAME_EMPTY',
      });
    }

    // Validate category
    if (!option.category || typeof option.category !== 'string') {
      errors.push({
        field: `options[${index}].category`,
        message: 'Option category is required and must be a string',
        code: 'OPTION_CATEGORY_INVALID',
      });
    } else {
      const validCategories = ['cloud', 'backend', 'database', 'frontend'];
      if (!validCategories.includes(option.category)) {
        warnings.push(`Option ${option.name} has unknown category '${option.category}' - will use generic evaluation`);
      }
    }

    // Validate metadata
    if (!option.metadata || typeof option.metadata !== 'object') {
      warnings.push(`Option ${option.name} has no metadata - will use fallback values`);
    } else {
      // Validate metadata structure for known categories
      const metadataValidation = this.knowledgeBase.validateOptionMetadata(option);
      if (!metadataValidation.isValid) {
        metadataValidation.errors.forEach(error => {
          warnings.push(`Option ${option.name} metadata issue: ${error}`);
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate that there are no duplicate options
   * @param options - Options to check for duplicates
   * @returns Validation result
   */
  private validateNoDuplicates(options: TechnicalOption[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const seen = new Set<string>();
    
    options.forEach((option, index) => {
      if (option && option.name) {
        const key = `${option.name.toLowerCase()}-${option.category}`;
        if (seen.has(key)) {
          errors.push({
            field: `options[${index}]`,
            message: `Duplicate option detected: ${option.name} (${option.category})`,
            code: 'OPTION_DUPLICATE',
          });
        } else {
          seen.add(key);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate that all options are from the same category
   * Mixed categories make comparison less meaningful
   * @param options - Options to check for category consistency
   * @returns Validation result
   */
  private validateCategoryConsistency(options: TechnicalOption[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const categories = new Set(options.map(option => option.category).filter(Boolean));
    
    if (categories.size > 1) {
      warnings.push(
        `Mixed categories detected: ${Array.from(categories).join(', ')}. ` +
        'Comparisons are most meaningful when all options are from the same category.'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Process and categorize technical options
   * Enriches options with fallback metadata if needed
   * @param options - Raw technical options
   * @returns Processed options with complete metadata
   */
  processOptions(options: TechnicalOption[]): TechnicalOption[] {
    return options.map(option => this.processOption(option));
  }

  /**
   * Process a single technical option
   * Ensures option has complete metadata for evaluation
   * @param option - Raw technical option
   * @returns Processed option with complete metadata
   */
  private processOption(option: TechnicalOption): TechnicalOption {
    // If option is already known in knowledge base, return as-is
    if (this.knowledgeBase.isKnownTechnology(option)) {
      return option;
    }

    // For unknown options, merge with fallback metadata
    const fallbackMetadata = this.knowledgeBase.getTechnologyMetadata(option);
    
    return {
      ...option,
      metadata: {
        ...fallbackMetadata,
        ...option.metadata, // User-provided metadata takes precedence
      },
    };
  }

  /**
   * Evaluate a set of technical options against user constraints
   * Main entry point for the comparison engine
   * @param options - Technical options to evaluate (2-3 options)
   * @param constraints - User constraints and priorities
   * @returns Complete evaluation result
   */
  evaluate(options: TechnicalOption[], constraints: UserConstraints): EvaluationResult {
    // Validate inputs
    const optionValidation = this.validateTechnicalOptions(options);
    if (!optionValidation.isValid) {
      throw new Error(`Invalid options: ${optionValidation.errors.map(e => e.message).join(', ')}`);
    }

    // Process options to ensure complete metadata
    const processedOptions = this.processOptions(options);

    // Calculate base scores for each option
    let scores = this.calculateScores(processedOptions, constraints);

    // Apply contextual adjustments based on user constraints
    scores = this.applyContextualAdjustments(scores, constraints);

    // Rank options by weighted score
    const rankings = this.rankOptions(scores);

    // Generate trade-off analysis
    const tradeOffs = this.generateTradeOffAnalysis(scores, constraints);

    return {
      scores,
      rankings,
      tradeOffs,
    };
  }

  /**
   * Calculate scores for all options
   * Requirement 2.2: Evaluate each option against all standard criteria
   * Requirement 2.3: Generate scores for cost, performance, scalability, learning curve, vendor lock-in, and maintainability
   * Requirement 2.4: Weight scores based on user priorities
   * @param options - Processed technical options
   * @param constraints - User constraints and priorities
   * @returns Array of option scores
   */
  private calculateScores(options: TechnicalOption[], constraints: UserConstraints): OptionScore[] {
    return options.map(option => this.calculateOptionScore(option, constraints));
  }

  /**
   * Calculate score for a single option
   * @param option - Technical option to score
   * @param constraints - User constraints and priorities
   * @returns Option score with criteria breakdown
   */
  private calculateOptionScore(option: TechnicalOption, constraints: UserConstraints): OptionScore {
    // Get base scores from knowledge base
    const baseScores = this.knowledgeBase.getComprehensiveEvaluation(option);
    
    // Apply priority-based weighting
    const weightedScore = this.calculateWeightedScore(baseScores, constraints.priorities);
    
    // Normalize score to 0-100 scale
    const normalizedScore = Math.round(weightedScore);

    return {
      option,
      criteriaScores: baseScores,
      weightedScore,
      normalizedScore,
    };
  }

  /**
   * Calculate weighted score based on user priorities with emphasis logic
   * Requirement 5.1: Cost priority emphasizes pricing, operational costs, and resource efficiency
   * Requirement 5.2: Performance priority emphasizes speed, throughput, and optimization capabilities
   * Requirement 5.3: Ease of use priority emphasizes learning curve, documentation quality, and developer experience
   * Requirement 5.4: Scalability priority emphasizes horizontal scaling, load handling, and growth accommodation
   * Requirement 5.5: Vendor lock-in avoidance priority emphasizes portability, standards compliance, and migration paths
   * @param criteriaScores - Raw scores for each criterion
   * @param priorities - User priority weights
   * @returns Weighted total score with priority emphasis
   */
  private calculateWeightedScore(
    criteriaScores: Record<string, number>, 
    priorities: UserConstraints['priorities']
  ): number {
    // Normalize priorities to ensure they sum to 1
    const normalizedPriorities = this.normalizePriorities(priorities);
    
    // Apply priority emphasis to adjust weights
    const emphasizedWeights = this.applyPriorityEmphasis(normalizedPriorities, priorities);
    
    let weightedSum = 0;
    let totalWeight = 0;

    // Apply emphasized weights for each standard criterion
    const criteriaMapping = {
      [STANDARD_CRITERIA.COST]: emphasizedWeights.cost,
      [STANDARD_CRITERIA.PERFORMANCE]: emphasizedWeights.performance,
      [STANDARD_CRITERIA.SCALABILITY]: emphasizedWeights.scalability,
      [STANDARD_CRITERIA.LEARNING_CURVE]: emphasizedWeights.easeOfUse,
      [STANDARD_CRITERIA.VENDOR_LOCK_IN]: emphasizedWeights.vendorLockIn,
      [STANDARD_CRITERIA.MAINTAINABILITY]: emphasizedWeights.cost * 0.3 + emphasizedWeights.performance * 0.2, // Composite weight
    };

    for (const [criterion, weight] of Object.entries(criteriaMapping)) {
      if (criteriaScores[criterion] !== undefined) {
        weightedSum += criteriaScores[criterion] * weight;
        totalWeight += weight;
      }
    }

    // Return weighted average, or 50 if no criteria matched
    return totalWeight > 0 ? weightedSum / totalWeight : 50;
  }

  /**
   * Apply priority emphasis logic to adjust weights based on user priorities
   * High priority criteria get amplified weights, low priority criteria get reduced weights
   * @param normalizedPriorities - Base normalized priorities
   * @param rawPriorities - Raw priority values (1-5 scale) for emphasis calculation
   * @returns Emphasized priority weights
   */
  private applyPriorityEmphasis(
    normalizedPriorities: UserConstraints['priorities'],
    rawPriorities: UserConstraints['priorities']
  ): UserConstraints['priorities'] {
    const emphasized = { ...normalizedPriorities };

    // Apply emphasis based on raw priority values
    // Priority 5 (highest) gets 1.5x emphasis
    // Priority 4 gets 1.2x emphasis  
    // Priority 3 (medium) gets 1.0x emphasis (no change)
    // Priority 2 gets 0.8x emphasis
    // Priority 1 (lowest) gets 0.5x emphasis

    const emphasisFactors = {
      cost: this.getEmphasisFactor(rawPriorities.cost),
      performance: this.getEmphasisFactor(rawPriorities.performance),
      easeOfUse: this.getEmphasisFactor(rawPriorities.easeOfUse),
      scalability: this.getEmphasisFactor(rawPriorities.scalability),
      vendorLockIn: this.getEmphasisFactor(rawPriorities.vendorLockIn),
    };

    // Apply emphasis factors
    emphasized.cost *= emphasisFactors.cost;
    emphasized.performance *= emphasisFactors.performance;
    emphasized.easeOfUse *= emphasisFactors.easeOfUse;
    emphasized.scalability *= emphasisFactors.scalability;
    emphasized.vendorLockIn *= emphasisFactors.vendorLockIn;

    // Re-normalize to ensure weights still sum to 1
    const total = emphasized.cost + emphasized.performance + emphasized.easeOfUse + 
                  emphasized.scalability + emphasized.vendorLockIn;

    if (total > 0) {
      emphasized.cost /= total;
      emphasized.performance /= total;
      emphasized.easeOfUse /= total;
      emphasized.scalability /= total;
      emphasized.vendorLockIn /= total;
    }

    return emphasized;
  }

  /**
   * Get emphasis factor based on priority level
   * @param priority - Priority level (1-5)
   * @returns Emphasis factor to multiply weight by
   */
  private getEmphasisFactor(priority: number): number {
    switch (priority) {
      case 5: return 1.5; // High priority - amplify
      case 4: return 1.2; // Above average - slight amplification
      case 3: return 1.0; // Medium priority - no change
      case 2: return 0.8; // Below average - slight reduction
      case 1: return 0.5; // Low priority - significant reduction
      default: return 1.0; // Default to no emphasis
    }
  }

  /**
   * Apply contextual adjustments based on user constraints
   * Adjusts scores based on budget, timeline, team experience, etc.
   * @param scores - Base option scores
   * @param constraints - User constraints
   * @returns Adjusted option scores
   */
  applyContextualAdjustments(scores: OptionScore[], constraints: UserConstraints): OptionScore[] {
    return scores.map(score => {
      const adjustedScore = { ...score };
      const adjustments = this.calculateContextualAdjustments(score.option, constraints);
      
      // Apply adjustments to criteria scores
      for (const [criterion, adjustment] of Object.entries(adjustments)) {
        if (adjustedScore.criteriaScores[criterion] !== undefined) {
          adjustedScore.criteriaScores[criterion] = Math.min(100, Math.max(0, 
            adjustedScore.criteriaScores[criterion] + adjustment
          ));
        }
      }

      // Recalculate weighted score with adjusted criteria scores
      adjustedScore.weightedScore = this.calculateWeightedScore(
        adjustedScore.criteriaScores, 
        constraints.priorities
      );
      adjustedScore.normalizedScore = Math.round(adjustedScore.weightedScore);

      return adjustedScore;
    });
  }

  /**
   * Calculate contextual adjustments for a specific option
   * @param option - Technical option to adjust
   * @param constraints - User constraints
   * @returns Adjustment values for each criterion
   */
  private calculateContextualAdjustments(
    option: TechnicalOption, 
    constraints: UserConstraints
  ): Record<string, number> {
    const adjustments: Record<string, number> = {};

    // Budget-based adjustments
    if (constraints.budget === 'low') {
      adjustments[STANDARD_CRITERIA.COST] = 10; // Boost cost-effective options
    } else if (constraints.budget === 'high') {
      adjustments[STANDARD_CRITERIA.PERFORMANCE] = 5; // Slight performance boost for high budget
    }

    // Timeline-based adjustments
    if (constraints.timeline === 'immediate') {
      adjustments[STANDARD_CRITERIA.LEARNING_CURVE] = 15; // Heavily favor easy-to-use options
    } else if (constraints.timeline === 'long') {
      adjustments[STANDARD_CRITERIA.SCALABILITY] = 10; // Favor scalable options for long-term projects
    }

    // Team experience adjustments
    if (constraints.team.skillLevel === 'junior') {
      adjustments[STANDARD_CRITERIA.LEARNING_CURVE] = 10; // Favor easier options for junior teams
      adjustments[STANDARD_CRITERIA.MAINTAINABILITY] = 5; // Favor maintainable options
    } else if (constraints.team.skillLevel === 'senior') {
      adjustments[STANDARD_CRITERIA.PERFORMANCE] = 5; // Senior teams can handle complex but performant options
    }

    // Experience-based adjustments
    if (constraints.team.experience.some(exp => 
      exp.toLowerCase().includes(option.name.toLowerCase())
    )) {
      adjustments[STANDARD_CRITERIA.LEARNING_CURVE] = 20; // Big boost for familiar technologies
      adjustments[STANDARD_CRITERIA.MAINTAINABILITY] = 10; // Easier to maintain familiar tech
    }

    // Scale-based adjustments
    if (constraints.scale.users > 100000 || constraints.scale.traffic === 'high') {
      adjustments[STANDARD_CRITERIA.SCALABILITY] = 15; // Heavily favor scalable options
      adjustments[STANDARD_CRITERIA.PERFORMANCE] = 10; // Performance is critical at scale
    }

    return adjustments;
  }

  /**
   * Normalize priority weights to sum to 1
   * @param priorities - Raw priority weights (1-5 scale)
   * @returns Normalized priority weights
   */
  private normalizePriorities(priorities: UserConstraints['priorities']): UserConstraints['priorities'] {
    const total = priorities.cost + priorities.performance + priorities.easeOfUse + 
                  priorities.scalability + priorities.vendorLockIn;
    
    // If total is 0, return equal weights
    if (total === 0) {
      return {
        cost: 0.2,
        performance: 0.2,
        easeOfUse: 0.2,
        scalability: 0.2,
        vendorLockIn: 0.2,
      };
    }

    // Normalize to proportional weights
    return {
      cost: priorities.cost / total,
      performance: priorities.performance / total,
      easeOfUse: priorities.easeOfUse / total,
      scalability: priorities.scalability / total,
      vendorLockIn: priorities.vendorLockIn / total,
    };
  }

  /**
   * Rank options by their weighted scores
   * @param scores - Option scores to rank
   * @returns Ranked options in descending order of score
   */
  private rankOptions(scores: OptionScore[]): RankedOption[] {
    // Sort by weighted score in descending order
    const sortedScores = [...scores].sort((a, b) => b.weightedScore - a.weightedScore);
    
    // Create ranked options with position information
    return sortedScores.map((score, index) => ({
      option: score.option,
      rank: index + 1,
      score: score.weightedScore,
    }));
  }

  /**
   * Generate trade-off analysis
   * Identifies which option is strongest/weakest for each criterion
   * @param scores - Option scores to analyze
   * @param constraints - User constraints for context
   * @returns Trade-off analysis with compromises
   */
  private generateTradeOffAnalysis(scores: OptionScore[], constraints: UserConstraints): TradeOffAnalysis {
    const strongestOption: Record<string, TechnicalOption> = {};
    const weakestOption: Record<string, TechnicalOption> = {};
    const compromises: Compromise[] = [];

    // Find strongest and weakest option for each criterion
    const allCriteria = new Set<string>();
    scores.forEach(score => {
      Object.keys(score.criteriaScores).forEach(criterion => allCriteria.add(criterion));
    });

    for (const criterion of allCriteria) {
      let strongest = scores[0];
      let weakest = scores[0];

      for (const score of scores) {
        const criterionScore = score.criteriaScores[criterion] || 0;
        const strongestScore = strongest?.criteriaScores[criterion] || 0;
        const weakestScore = weakest?.criteriaScores[criterion] || 0;

        if (criterionScore > strongestScore) {
          strongest = score;
        }
        if (criterionScore < weakestScore) {
          weakest = score;
        }
      }

      if (strongest && weakest) {
        strongestOption[criterion] = strongest.option;
        weakestOption[criterion] = weakest.option;
      }
    }

    // Generate compromises for each option
    for (const score of scores) {
      const optionCompromises = this.identifyCompromises(score, scores, constraints);
      compromises.push(...optionCompromises);
    }

    return {
      strongestOption,
      weakestOption,
      compromises,
    };
  }

  /**
   * Identify compromises for a specific option
   * @param optionScore - Score for the option to analyze
   * @param allScores - All option scores for comparison
   * @param constraints - User constraints for context
   * @returns Array of compromises for this option
   */
  private identifyCompromises(
    optionScore: OptionScore, 
    allScores: OptionScore[], 
    constraints: UserConstraints
  ): Compromise[] {
    const compromises: Compromise[] = [];
    const priorities = constraints.priorities;

    // Find criteria where this option is significantly weaker than others
    for (const [criterion, score] of Object.entries(optionScore.criteriaScores)) {
      const otherScores = allScores
        .filter(s => s.option.name !== optionScore.option.name)
        .map(s => s.criteriaScores[criterion] || 0);
      
      const maxOtherScore = Math.max(...otherScores);
      const scoreDifference = maxOtherScore - score;

      // If this option is significantly weaker (>20 points) in a criterion
      if (scoreDifference > 20) {
        const priority = this.getCriterionPriority(criterion, priorities);
        const impact = this.determineImpact(scoreDifference, priority);

        compromises.push({
          description: `Choosing ${optionScore.option.name} means accepting weaker ${criterion} performance`,
          impact,
          affectedCriteria: [criterion],
        });
      }
    }

    return compromises;
  }

  /**
   * Get priority level for a specific criterion
   * @param criterion - Criterion name
   * @param priorities - User priorities
   * @returns Priority level (1-5)
   */
  private getCriterionPriority(criterion: string, priorities: UserConstraints['priorities']): number {
    switch (criterion) {
      case STANDARD_CRITERIA.COST:
        return priorities.cost;
      case STANDARD_CRITERIA.PERFORMANCE:
        return priorities.performance;
      case STANDARD_CRITERIA.SCALABILITY:
        return priorities.scalability;
      case STANDARD_CRITERIA.LEARNING_CURVE:
        return priorities.easeOfUse;
      case STANDARD_CRITERIA.VENDOR_LOCK_IN:
        return priorities.vendorLockIn;
      case STANDARD_CRITERIA.MAINTAINABILITY:
        return Math.max(priorities.cost, priorities.performance); // Composite priority
      default:
        return 3; // Default medium priority
    }
  }

  /**
   * Determine impact level based on score difference and priority
   * @param scoreDifference - How much weaker this option is
   * @param priority - User priority for this criterion (1-5)
   * @returns Impact level
   */
  private determineImpact(scoreDifference: number, priority: number): 'low' | 'medium' | 'high' {
    const impactScore = (scoreDifference / 100) * priority;

    if (impactScore > 0.15) return 'high';
    if (impactScore > 0.08) return 'medium';
    return 'low';
  }
}