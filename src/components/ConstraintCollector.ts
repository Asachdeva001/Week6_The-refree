/**
 * Constraint Collector Component
 * Responsible for capturing, validating, and normalizing user constraints
 * Implements Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { 
  UserConstraints, 
  ConstraintCollector as IConstraintCollector,
  ValidationResult,
  ValidationError 
} from '../types';

/**
 * Implementation of the Constraint Collector interface
 * Handles all aspects of user constraint processing
 */
export class ConstraintCollector implements IConstraintCollector {
  
  /**
   * Validate complete user constraints
   * Ensures all required fields are present and valid
   * @param constraints - User constraints to validate
   * @returns Validation result with errors and warnings
   */
  validateConstraints(constraints: UserConstraints): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validate budget
    const budgetValidation = this.validateBudget(constraints.budget);
    errors.push(...budgetValidation.errors);
    warnings.push(...budgetValidation.warnings);

    // Validate scale
    const scaleValidation = this.validateScale(constraints.scale);
    errors.push(...scaleValidation.errors);
    warnings.push(...scaleValidation.warnings);

    // Validate team
    const teamValidation = this.validateTeam(constraints.team);
    errors.push(...teamValidation.errors);
    warnings.push(...teamValidation.warnings);

    // Validate timeline
    const timelineValidation = this.validateTimeline(constraints.timeline);
    errors.push(...timelineValidation.errors);
    warnings.push(...timelineValidation.warnings);

    // Validate priorities
    const prioritiesValidation = this.validatePriorities(constraints.priorities);
    errors.push(...prioritiesValidation.errors);
    warnings.push(...prioritiesValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate budget level
   * Requirement 1.1: Budget level (low/medium/high)
   */
  private validateBudget(budget: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!budget) {
      errors.push({
        field: 'budget',
        message: 'Budget level is required',
        code: 'BUDGET_REQUIRED',
      });
    } else if (!['low', 'medium', 'high'].includes(budget)) {
      errors.push({
        field: 'budget',
        message: 'Budget must be one of: low, medium, high',
        code: 'BUDGET_INVALID',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate scale parameters
   * Requirement 1.2: Expected scale (user count, traffic volume)
   */
  private validateScale(scale: UserConstraints['scale']): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!scale) {
      errors.push({
        field: 'scale',
        message: 'Scale information is required',
        code: 'SCALE_REQUIRED',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate user count
    if (typeof scale.users !== 'number') {
      errors.push({
        field: 'scale.users',
        message: 'User count must be a number',
        code: 'USERS_INVALID_TYPE',
      });
    } else if (scale.users < 0) {
      errors.push({
        field: 'scale.users',
        message: 'User count cannot be negative',
        code: 'USERS_NEGATIVE',
      });
    } else if (scale.users === 0) {
      warnings.push('User count is zero - consider if this is realistic for your use case');
    } else if (scale.users > 1000000) {
      warnings.push('Very high user count detected - ensure scalability is prioritized');
    }

    // Validate traffic level
    if (!scale.traffic) {
      errors.push({
        field: 'scale.traffic',
        message: 'Traffic level is required',
        code: 'TRAFFIC_REQUIRED',
      });
    } else if (!['low', 'medium', 'high'].includes(scale.traffic)) {
      errors.push({
        field: 'scale.traffic',
        message: 'Traffic must be one of: low, medium, high',
        code: 'TRAFFIC_INVALID',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate team information
   * Requirement 1.3: Team skill level and experience
   */
  private validateTeam(team: UserConstraints['team']): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!team) {
      errors.push({
        field: 'team',
        message: 'Team information is required',
        code: 'TEAM_REQUIRED',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate skill level
    if (!team.skillLevel) {
      errors.push({
        field: 'team.skillLevel',
        message: 'Team skill level is required',
        code: 'SKILL_LEVEL_REQUIRED',
      });
    } else if (!['junior', 'mixed', 'senior'].includes(team.skillLevel)) {
      errors.push({
        field: 'team.skillLevel',
        message: 'Skill level must be one of: junior, mixed, senior',
        code: 'SKILL_LEVEL_INVALID',
      });
    }

    // Validate experience array
    if (!Array.isArray(team.experience)) {
      errors.push({
        field: 'team.experience',
        message: 'Experience must be an array of technologies',
        code: 'EXPERIENCE_INVALID_TYPE',
      });
    } else {
      // Check for empty experience with junior team
      if (team.experience.length === 0 && team.skillLevel === 'junior') {
        warnings.push('Junior team with no listed experience - consider prioritizing ease of use');
      }

      // Validate experience entries
      team.experience.forEach((tech, index) => {
        if (typeof tech !== 'string' || tech.trim().length === 0) {
          errors.push({
            field: `team.experience[${index}]`,
            message: 'Experience entries must be non-empty strings',
            code: 'EXPERIENCE_ENTRY_INVALID',
          });
        }
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate timeline requirements
   * Requirement 1.4: Time-to-market requirements
   */
  private validateTimeline(timeline: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!timeline) {
      errors.push({
        field: 'timeline',
        message: 'Timeline is required',
        code: 'TIMELINE_REQUIRED',
      });
    } else if (!['immediate', 'short', 'medium', 'long'].includes(timeline)) {
      errors.push({
        field: 'timeline',
        message: 'Timeline must be one of: immediate, short, medium, long',
        code: 'TIMELINE_INVALID',
      });
    } else if (timeline === 'immediate') {
      warnings.push('Immediate timeline may limit technology options - consider prioritizing ease of use');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate priority weights
   * Requirement 1.5: Priority ranking (cost, performance, ease of use, scalability, vendor lock-in avoidance)
   */
  private validatePriorities(priorities: UserConstraints['priorities']): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!priorities) {
      errors.push({
        field: 'priorities',
        message: 'Priorities are required',
        code: 'PRIORITIES_REQUIRED',
      });
      return { isValid: false, errors, warnings };
    }

    const requiredPriorities = ['cost', 'performance', 'easeOfUse', 'scalability', 'vendorLockIn'];
    const priorityValues = Object.values(priorities);

    // Check all required priorities are present
    for (const priority of requiredPriorities) {
      const value = priorities[priority as keyof typeof priorities];
      
      if (typeof value !== 'number') {
        errors.push({
          field: `priorities.${priority}`,
          message: `${priority} priority must be a number`,
          code: 'PRIORITY_INVALID_TYPE',
        });
      } else if (value < 1 || value > 5) {
        errors.push({
          field: `priorities.${priority}`,
          message: `${priority} priority must be between 1 and 5`,
          code: 'PRIORITY_OUT_OF_RANGE',
        });
      }
    }

    // Check for balanced priorities (all same value)
    if (priorityValues.length > 0 && priorityValues.every(v => v === priorityValues[0])) {
      warnings.push('All priorities have the same weight - consider differentiating based on your specific needs');
    }

    // Check for extreme priorities (all 1s or all 5s)
    if (priorityValues.every(v => v === 1)) {
      warnings.push('All priorities set to minimum - this may not provide meaningful differentiation');
    } else if (priorityValues.every(v => v === 5)) {
      warnings.push('All priorities set to maximum - consider which factors are most important');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Normalize priority weights to ensure consistent scaling
   * Converts 1-5 scale to proportional weights that sum to 1
   * @param priorities - Raw priority weights (1-5 scale)
   * @returns Normalized priority weights
   */
  normalizePriorities(priorities: UserConstraints['priorities']): UserConstraints['priorities'] {
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
   * Sanitize user input to prevent injection attacks
   * Removes potentially dangerous characters and limits string lengths
   * @param input - Raw user input
   * @returns Sanitized input
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
        .trim()
        .substring(0, 100); // Limit length
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}