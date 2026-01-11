/**
 * Constraint Collection Interface
 * Provides structured methods for collecting user constraints step by step
 * Implements Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { UserConstraints, ValidationResult } from '../types';
import { ConstraintCollector } from './ConstraintCollector';

/**
 * Form data for budget collection
 * Requirement 1.1: Budget level (low/medium/high)
 */
export interface BudgetForm {
  budget: 'low' | 'medium' | 'high';
}

/**
 * Form data for scale collection
 * Requirement 1.2: Expected scale (user count, traffic volume)
 */
export interface ScaleForm {
  users: number;
  traffic: 'low' | 'medium' | 'high';
}

/**
 * Form data for team collection
 * Requirement 1.3: Team skill level and experience
 */
export interface TeamForm {
  skillLevel: 'junior' | 'mixed' | 'senior';
  experience: string[];
}

/**
 * Form data for timeline collection
 * Requirement 1.4: Time-to-market requirements
 */
export interface TimelineForm {
  timeline: 'immediate' | 'short' | 'medium' | 'long';
}

/**
 * Form data for priority collection
 * Requirement 1.5: Priority ranking
 */
export interface PriorityForm {
  cost: number;
  performance: number;
  easeOfUse: number;
  scalability: number;
  vendorLockIn: number;
}

/**
 * Collection step enumeration
 */
export enum CollectionStep {
  BUDGET = 'budget',
  SCALE = 'scale',
  TEAM = 'team',
  TIMELINE = 'timeline',
  PRIORITIES = 'priorities',
  COMPLETE = 'complete'
}

/**
 * Step-by-step constraint collection interface
 * Guides users through the constraint definition process
 */
export class ConstraintCollectionInterface {
  private collector: ConstraintCollector;
  private partialConstraints: Partial<UserConstraints> = {};
  private currentStep: CollectionStep = CollectionStep.BUDGET;

  constructor() {
    this.collector = new ConstraintCollector();
  }

  /**
   * Start a new constraint collection session
   * Resets any previous partial data
   */
  startCollection(): void {
    this.partialConstraints = {};
    this.currentStep = CollectionStep.BUDGET;
  }

  /**
   * Get the current collection step
   */
  getCurrentStep(): CollectionStep {
    return this.currentStep;
  }

  /**
   * Get progress through the collection process (0-1)
   */
  getProgress(): number {
    const steps = Object.values(CollectionStep);
    const currentIndex = steps.indexOf(this.currentStep);
    return currentIndex / (steps.length - 1); // -1 because COMPLETE is the final state
  }

  /**
   * Collect budget information
   * Requirement 1.1: Budget level (low/medium/high)
   */
  collectBudget(form: BudgetForm): ValidationResult {
    const sanitizedForm = this.collector.sanitizeInput(form) as BudgetForm;
    
    // Validate budget input
    const validation = this.collector.validateConstraints({
      budget: sanitizedForm.budget,
      scale: { users: 0, traffic: 'low' },
      team: { skillLevel: 'mixed', experience: [] },
      timeline: 'medium',
      priorities: { cost: 3, performance: 3, easeOfUse: 3, scalability: 3, vendorLockIn: 3 }
    } as UserConstraints);

    // Extract budget-specific errors
    const budgetErrors = validation.errors.filter(error => error.field.startsWith('budget'));
    const budgetWarnings = validation.warnings.filter(warning => warning.includes('budget'));

    if (budgetErrors.length === 0) {
      this.partialConstraints.budget = sanitizedForm.budget;
      this.currentStep = CollectionStep.SCALE;
    }

    return {
      isValid: budgetErrors.length === 0,
      errors: budgetErrors,
      warnings: budgetWarnings
    };
  }

  /**
   * Collect scale information
   * Requirement 1.2: Expected scale (user count, traffic volume)
   */
  collectScale(form: ScaleForm): ValidationResult {
    const sanitizedForm = this.collector.sanitizeInput(form) as ScaleForm;
    
    // Validate scale input
    const validation = this.collector.validateConstraints({
      budget: 'medium',
      scale: { users: sanitizedForm.users, traffic: sanitizedForm.traffic },
      team: { skillLevel: 'mixed', experience: [] },
      timeline: 'medium',
      priorities: { cost: 3, performance: 3, easeOfUse: 3, scalability: 3, vendorLockIn: 3 }
    } as UserConstraints);

    // Extract scale-specific errors
    const scaleErrors = validation.errors.filter(error => error.field.startsWith('scale'));
    const scaleWarnings = validation.warnings.filter(warning => 
      warning.includes('user') || warning.includes('traffic') || warning.includes('scale')
    );

    if (scaleErrors.length === 0) {
      this.partialConstraints.scale = {
        users: sanitizedForm.users,
        traffic: sanitizedForm.traffic
      };
      this.currentStep = CollectionStep.TEAM;
    }

    return {
      isValid: scaleErrors.length === 0,
      errors: scaleErrors,
      warnings: scaleWarnings
    };
  }

  /**
   * Collect team information
   * Requirement 1.3: Team skill level and experience
   */
  collectTeam(form: TeamForm): ValidationResult {
    const sanitizedForm = this.collector.sanitizeInput(form) as TeamForm;
    
    // Validate team input
    const validation = this.collector.validateConstraints({
      budget: 'medium',
      scale: { users: 1000, traffic: 'medium' },
      team: { skillLevel: sanitizedForm.skillLevel, experience: sanitizedForm.experience },
      timeline: 'medium',
      priorities: { cost: 3, performance: 3, easeOfUse: 3, scalability: 3, vendorLockIn: 3 }
    } as UserConstraints);

    // Extract team-specific errors
    const teamErrors = validation.errors.filter(error => error.field.startsWith('team'));
    const teamWarnings = validation.warnings.filter(warning => 
      warning.includes('team') || warning.includes('experience') || warning.includes('skill')
    );

    if (teamErrors.length === 0) {
      this.partialConstraints.team = {
        skillLevel: sanitizedForm.skillLevel,
        experience: sanitizedForm.experience
      };
      this.currentStep = CollectionStep.TIMELINE;
    }

    return {
      isValid: teamErrors.length === 0,
      errors: teamErrors,
      warnings: teamWarnings
    };
  }

  /**
   * Collect timeline information
   * Requirement 1.4: Time-to-market requirements
   */
  collectTimeline(form: TimelineForm): ValidationResult {
    const sanitizedForm = this.collector.sanitizeInput(form) as TimelineForm;
    
    // Validate timeline input
    const validation = this.collector.validateConstraints({
      budget: 'medium',
      scale: { users: 1000, traffic: 'medium' },
      team: { skillLevel: 'mixed', experience: [] },
      timeline: sanitizedForm.timeline,
      priorities: { cost: 3, performance: 3, easeOfUse: 3, scalability: 3, vendorLockIn: 3 }
    } as UserConstraints);

    // Extract timeline-specific errors
    const timelineErrors = validation.errors.filter(error => error.field.startsWith('timeline'));
    const timelineWarnings = validation.warnings.filter(warning => 
      warning.includes('timeline') || warning.includes('immediate')
    );

    if (timelineErrors.length === 0) {
      this.partialConstraints.timeline = sanitizedForm.timeline;
      this.currentStep = CollectionStep.PRIORITIES;
    }

    return {
      isValid: timelineErrors.length === 0,
      errors: timelineErrors,
      warnings: timelineWarnings
    };
  }

  /**
   * Collect priority information with ranking interface
   * Requirement 1.5: Priority ranking (cost, performance, ease of use, scalability, vendor lock-in avoidance)
   */
  collectPriorities(form: PriorityForm): ValidationResult {
    const sanitizedForm = this.collector.sanitizeInput(form) as PriorityForm;
    
    // Validate priorities input
    const validation = this.collector.validateConstraints({
      budget: 'medium',
      scale: { users: 1000, traffic: 'medium' },
      team: { skillLevel: 'mixed', experience: [] },
      timeline: 'medium',
      priorities: {
        cost: sanitizedForm.cost,
        performance: sanitizedForm.performance,
        easeOfUse: sanitizedForm.easeOfUse,
        scalability: sanitizedForm.scalability,
        vendorLockIn: sanitizedForm.vendorLockIn
      }
    } as UserConstraints);

    // Extract priority-specific errors
    const priorityErrors = validation.errors.filter(error => error.field.startsWith('priorities'));
    const priorityWarnings = validation.warnings.filter(warning => 
      warning.includes('priorities') || warning.includes('priority')
    );

    if (priorityErrors.length === 0) {
      this.partialConstraints.priorities = {
        cost: sanitizedForm.cost,
        performance: sanitizedForm.performance,
        easeOfUse: sanitizedForm.easeOfUse,
        scalability: sanitizedForm.scalability,
        vendorLockIn: sanitizedForm.vendorLockIn
      };
      this.currentStep = CollectionStep.COMPLETE;
    }

    return {
      isValid: priorityErrors.length === 0,
      errors: priorityErrors,
      warnings: priorityWarnings
    };
  }

  /**
   * Get the complete constraints if collection is finished
   */
  getCompleteConstraints(): UserConstraints | null {
    if (this.currentStep !== CollectionStep.COMPLETE) {
      return null;
    }

    // Validate that all required fields are present
    if (!this.partialConstraints.budget || 
        !this.partialConstraints.scale ||
        !this.partialConstraints.team ||
        !this.partialConstraints.timeline ||
        !this.partialConstraints.priorities) {
      return null;
    }

    return this.partialConstraints as UserConstraints;
  }

  /**
   * Get current partial constraints for display/editing
   */
  getPartialConstraints(): Partial<UserConstraints> {
    return { ...this.partialConstraints };
  }

  /**
   * Validate the complete constraints
   */
  validateComplete(): ValidationResult {
    const constraints = this.getCompleteConstraints();
    if (!constraints) {
      return {
        isValid: false,
        errors: [{
          field: 'constraints',
          message: 'Constraint collection is not complete',
          code: 'COLLECTION_INCOMPLETE'
        }],
        warnings: []
      };
    }

    return this.collector.validateConstraints(constraints);
  }

  /**
   * Go back to a previous step
   */
  goToStep(step: CollectionStep): boolean {
    const steps = [
      CollectionStep.BUDGET,
      CollectionStep.SCALE,
      CollectionStep.TEAM,
      CollectionStep.TIMELINE,
      CollectionStep.PRIORITIES,
      CollectionStep.COMPLETE
    ];

    const currentIndex = steps.indexOf(this.currentStep);
    const targetIndex = steps.indexOf(step);

    // Only allow going back or staying at current step
    if (targetIndex <= currentIndex) {
      this.currentStep = step;
      return true;
    }

    return false;
  }

  /**
   * Get form field options for dropdowns
   */
  getFormOptions() {
    return {
      budget: ['low', 'medium', 'high'] as const,
      traffic: ['low', 'medium', 'high'] as const,
      skillLevel: ['junior', 'mixed', 'senior'] as const,
      timeline: ['immediate', 'short', 'medium', 'long'] as const,
      priorityRange: { min: 1, max: 5 }
    };
  }

  /**
   * Get priority ranking helper methods
   */
  getPriorityRankingHelpers() {
    return {
      /**
       * Convert 1-5 scale to descriptive labels
       */
      getPriorityLabel: (value: number): string => {
        switch (value) {
          case 1: return 'Very Low';
          case 2: return 'Low';
          case 3: return 'Medium';
          case 4: return 'High';
          case 5: return 'Very High';
          default: return 'Unknown';
        }
      },

      /**
       * Get priority descriptions for UI help text
       */
      getPriorityDescriptions: () => ({
        cost: 'How important is minimizing costs (infrastructure, licensing, operational)',
        performance: 'How important is maximizing speed, throughput, and responsiveness',
        easeOfUse: 'How important is having a gentle learning curve and good developer experience',
        scalability: 'How important is the ability to handle growth in users and traffic',
        vendorLockIn: 'How important is avoiding dependency on a single vendor (higher = more important to avoid)'
      }),

      /**
       * Validate priority balance and provide suggestions
       */
      analyzePriorityBalance: (priorities: PriorityForm): { 
        isBalanced: boolean; 
        suggestions: string[] 
      } => {
        const values = Object.values(priorities);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
        
        const suggestions: string[] = [];
        const isBalanced = variance > 0.5; // Some differentiation exists

        if (variance < 0.1) {
          suggestions.push('Consider differentiating your priorities - having some priorities higher than others will lead to more targeted recommendations');
        }

        if (values.every(v => v >= 4)) {
          suggestions.push('All priorities are high - consider which 1-2 factors are most critical for your project');
        }

        if (values.every(v => v <= 2)) {
          suggestions.push('All priorities are low - consider which factors are most important for your success');
        }

        return { isBalanced, suggestions };
      }
    };
  }
}