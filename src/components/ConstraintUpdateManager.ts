/**
 * Constraint Update Manager
 * Handles constraint modification and re-evaluation functionality
 * Implements Requirement 6.3: Allow re-evaluation with updated parameters
 */

import { 
  UserConstraints, 
  UserConstraintUpdates,
  TechnicalOption, 
  EvaluationResult,
  UserSession,
  ValidationResult,
  ValidationError 
} from '../types';
import { ConstraintCollector } from './ConstraintCollector';
import { ComparisonEngine } from './ComparisonEngine';
import { KnowledgeBase } from './KnowledgeBase';

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
 * Implementation of constraint update management
 */
export class ConstraintUpdateManagerImpl implements ConstraintUpdateManager {
  private constraintCollector: ConstraintCollector;
  private comparisonEngine: ComparisonEngine;
  private sessions: Map<string, UserSession> = new Map();
  private modificationHistory: Map<string, ConstraintModification[]> = new Map();

  constructor(knowledgeBase?: KnowledgeBase) {
    this.constraintCollector = new ConstraintCollector();
    this.comparisonEngine = new ComparisonEngine(knowledgeBase);
  }

  /**
   * Set session data (for integration with existing session management)
   * @param sessionId - Session ID
   * @param session - Session data
   */
  setSession(sessionId: string, session: UserSession): void {
    this.sessions.set(sessionId, session);
  }

  /**
   * Get session data
   * @param sessionId - Session ID
   * @returns Session data or null if not found
   */
  getSession(sessionId: string): UserSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update specific constraint fields and trigger re-evaluation
   * Requirement 6.3: Allow re-evaluation with updated parameters
   * @param sessionId - Session to update
   * @param constraintUpdates - Partial constraint updates
   * @returns Updated evaluation result
   */
  async updateConstraints(sessionId: string, constraintUpdates: UserConstraintUpdates): Promise<ConstraintUpdateResult> {
    const session = this.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        updatedConstraints: {} as UserConstraints,
        evaluationResult: null,
        errors: [{
          field: 'sessionId',
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }],
        warnings: [],
        changesSummary: []
      };
    }

    // Validate the proposed updates
    const validation = this.validateConstraintUpdates(session.constraints, constraintUpdates);
    if (!validation.isValid) {
      return {
        success: false,
        updatedConstraints: session.constraints,
        evaluationResult: null,
        errors: validation.errors,
        warnings: validation.warnings,
        changesSummary: []
      };
    }

    // Record the modification before applying changes
    const modification = this.recordModification(sessionId, session.constraints, constraintUpdates);

    // Apply the updates
    const updatedConstraints = this.mergeConstraints(session.constraints, constraintUpdates);
    
    // Update the session
    session.constraints = updatedConstraints;
    this.setSession(sessionId, session);

    // Trigger re-evaluation if options are available
    let evaluationResult: EvaluationResult | null = null;
    if (session.selectedOptions && session.selectedOptions.length >= 2) {
      try {
        evaluationResult = this.comparisonEngine.evaluate(session.selectedOptions, updatedConstraints);
        
        // Add to evaluation history
        session.evaluationHistory.push(evaluationResult);
        this.setSession(sessionId, session);
      } catch (error) {
        return {
          success: false,
          updatedConstraints,
          evaluationResult: null,
          errors: [{
            field: 'evaluation',
            message: `Re-evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            code: 'EVALUATION_FAILED'
          }],
          warnings: validation.warnings,
          changesSummary: modification.modifiedFields.map(field => `Updated ${field}`)
        };
      }
    }

    return {
      success: true,
      updatedConstraints,
      evaluationResult,
      errors: [],
      warnings: validation.warnings,
      changesSummary: this.generateChangesSummary(modification)
    };
  }

  /**
   * Update priorities and trigger re-evaluation
   * @param sessionId - Session to update
   * @param newPriorities - New priority weights
   * @returns Updated evaluation result
   */
  async updatePriorities(sessionId: string, newPriorities: UserConstraints['priorities']): Promise<ConstraintUpdateResult> {
    return this.updateConstraints(sessionId, { priorities: newPriorities });
  }

  /**
   * Validate constraint updates before applying
   * @param currentConstraints - Current constraint values
   * @param updates - Proposed updates
   * @returns Validation result
   */
  validateConstraintUpdates(currentConstraints: UserConstraints, updates: UserConstraintUpdates): ValidationResult {
    // Create a merged constraint object for validation
    const mergedConstraints = this.mergeConstraints(currentConstraints, updates);
    
    // Use the existing constraint collector validation
    const validation = this.constraintCollector.validateConstraints(mergedConstraints);
    
    // Add specific warnings for constraint updates
    const warnings = [...validation.warnings];
    
    // Check for significant priority changes
    if (updates.priorities) {
      const priorityChanges = this.analyzePriorityChanges(currentConstraints.priorities, updates.priorities);
      if (priorityChanges.significantChanges.length > 0) {
        warnings.push(`Significant priority changes detected: ${priorityChanges.significantChanges.join(', ')}`);
      }
    }

    // Check for scale changes that might affect recommendations
    if (updates.scale) {
      const scaleChanges = this.analyzeScaleChanges(currentConstraints.scale, updates.scale);
      if (scaleChanges.length > 0) {
        warnings.push(`Scale changes may significantly affect recommendations: ${scaleChanges.join(', ')}`);
      }
    }

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings
    };
  }

  /**
   * Get constraint modification history for a session
   * @param sessionId - Session to get history for
   * @returns Array of constraint modifications
   */
  getModificationHistory(sessionId: string): ConstraintModification[] {
    return this.modificationHistory.get(sessionId) || [];
  }

  /**
   * Merge current constraints with updates
   * @param current - Current constraints
   * @param updates - Partial updates
   * @returns Merged constraints
   */
  private mergeConstraints(current: UserConstraints, updates: UserConstraintUpdates): UserConstraints {
    const merged = { ...current };

    // Handle nested objects properly
    if (updates.scale) {
      merged.scale = { ...current.scale, ...updates.scale };
    }

    if (updates.team) {
      merged.team = { ...current.team, ...updates.team };
    }

    if (updates.priorities) {
      merged.priorities = { ...current.priorities, ...updates.priorities };
    }

    // Handle simple fields
    if (updates.budget !== undefined) {
      merged.budget = updates.budget;
    }

    if (updates.timeline !== undefined) {
      merged.timeline = updates.timeline;
    }

    return merged;
  }

  /**
   * Record a constraint modification for history tracking
   * @param sessionId - Session ID
   * @param previousConstraints - Previous constraint values
   * @param updates - Applied updates
   * @returns Modification record
   */
  private recordModification(
    sessionId: string, 
    previousConstraints: UserConstraints, 
    updates: UserConstraintUpdates
  ): ConstraintModification {
    const modifiedFields = this.getModifiedFields(updates);
    const previousValues = this.extractPreviousValues(previousConstraints, modifiedFields);

    const modification: ConstraintModification = {
      timestamp: new Date(),
      modifiedFields,
      previousValues,
      newValues: updates
    };

    // Add to history
    const history = this.modificationHistory.get(sessionId) || [];
    history.push(modification);
    this.modificationHistory.set(sessionId, history);

    return modification;
  }

  /**
   * Get list of modified field names from updates
   * @param updates - Constraint updates
   * @returns Array of modified field names
   */
  private getModifiedFields(updates: UserConstraintUpdates): string[] {
    const fields: string[] = [];

    if (updates.budget !== undefined) fields.push('budget');
    if (updates.timeline !== undefined) fields.push('timeline');
    
    if (updates.scale) {
      if (updates.scale.users !== undefined) fields.push('scale.users');
      if (updates.scale.traffic !== undefined) fields.push('scale.traffic');
    }

    if (updates.team) {
      if (updates.team.skillLevel !== undefined) fields.push('team.skillLevel');
      if (updates.team.experience !== undefined) fields.push('team.experience');
    }

    if (updates.priorities) {
      Object.keys(updates.priorities).forEach(key => {
        if (updates.priorities![key as keyof UserConstraints['priorities']] !== undefined) {
          fields.push(`priorities.${key}`);
        }
      });
    }

    return fields;
  }

  /**
   * Extract previous values for modified fields
   * @param constraints - Previous constraints
   * @param modifiedFields - List of modified field names
   * @returns Previous values for modified fields
   */
  private extractPreviousValues(constraints: UserConstraints, modifiedFields: string[]): UserConstraintUpdates {
    const previous: UserConstraintUpdates = {};

    modifiedFields.forEach(field => {
      if (field === 'budget') {
        previous.budget = constraints.budget;
      } else if (field === 'timeline') {
        previous.timeline = constraints.timeline;
      } else if (field.startsWith('scale.')) {
        if (!previous.scale) previous.scale = {};
        if (field === 'scale.users') previous.scale!.users = constraints.scale.users;
        if (field === 'scale.traffic') previous.scale!.traffic = constraints.scale.traffic;
      } else if (field.startsWith('team.')) {
        if (!previous.team) previous.team = {};
        if (field === 'team.skillLevel') previous.team!.skillLevel = constraints.team.skillLevel;
        if (field === 'team.experience') previous.team!.experience = [...constraints.team.experience];
      } else if (field.startsWith('priorities.')) {
        if (!previous.priorities) previous.priorities = {};
        const priorityKey = field.split('.')[1] as keyof UserConstraints['priorities'];
        previous.priorities![priorityKey] = constraints.priorities[priorityKey];
      }
    });

    return previous;
  }

  /**
   * Generate human-readable summary of changes
   * @param modification - Modification record
   * @returns Array of change descriptions
   */
  private generateChangesSummary(modification: ConstraintModification): string[] {
    const summary: string[] = [];

    modification.modifiedFields.forEach(field => {
      const newValue = this.getNestedValue(modification.newValues, field);
      const oldValue = this.getNestedValue(modification.previousValues, field);

      if (field === 'budget') {
        summary.push(`Budget changed from ${oldValue} to ${newValue}`);
      } else if (field === 'timeline') {
        summary.push(`Timeline changed from ${oldValue} to ${newValue}`);
      } else if (field === 'scale.users') {
        summary.push(`Expected users changed from ${oldValue} to ${newValue}`);
      } else if (field === 'scale.traffic') {
        summary.push(`Traffic level changed from ${oldValue} to ${newValue}`);
      } else if (field === 'team.skillLevel') {
        summary.push(`Team skill level changed from ${oldValue} to ${newValue}`);
      } else if (field === 'team.experience') {
        summary.push(`Team experience updated`);
      } else if (field.startsWith('priorities.')) {
        const priorityName = field.split('.')[1];
        summary.push(`${priorityName} priority changed from ${oldValue} to ${newValue}`);
      }
    });

    return summary;
  }

  /**
   * Get nested value from object using dot notation
   * @param obj - Object to get value from
   * @param path - Dot-separated path
   * @returns Value at path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Analyze priority changes to identify significant shifts
   * @param oldPriorities - Previous priorities
   * @param newPriorities - New priorities
   * @returns Analysis of priority changes
   */
  private analyzePriorityChanges(
    oldPriorities: UserConstraints['priorities'], 
    newPriorities: Partial<UserConstraints['priorities']>
  ): { significantChanges: string[] } {
    const significantChanges: string[] = [];
    const threshold = 2; // Changes of 2+ points are considered significant

    Object.entries(newPriorities).forEach(([key, newValue]) => {
      if (newValue !== undefined) {
        const oldValue = oldPriorities[key as keyof UserConstraints['priorities']];
        const change = Math.abs(newValue - oldValue);
        
        if (change >= threshold) {
          const direction = newValue > oldValue ? 'increased' : 'decreased';
          significantChanges.push(`${key} ${direction} by ${change} points`);
        }
      }
    });

    return { significantChanges };
  }

  /**
   * Analyze scale changes to identify significant impacts
   * @param oldScale - Previous scale
   * @param newScale - New scale
   * @returns Array of significant scale changes
   */
  private analyzeScaleChanges(
    oldScale: UserConstraints['scale'], 
    newScale: Partial<UserConstraints['scale']>
  ): string[] {
    const changes: string[] = [];

    if (newScale.users !== undefined) {
      const userChange = newScale.users / oldScale.users;
      if (userChange > 2 || userChange < 0.5) {
        changes.push(`User count changed significantly (${oldScale.users} → ${newScale.users})`);
      }
    }

    if (newScale.traffic !== undefined && newScale.traffic !== oldScale.traffic) {
      changes.push(`Traffic level changed from ${oldScale.traffic} to ${newScale.traffic}`);
    }

    return changes;
  }
}