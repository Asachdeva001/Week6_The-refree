/**
 * Tests for ConstraintUpdateManager
 * Validates constraint modification and re-evaluation functionality
 */

import { ConstraintUpdateManagerImpl } from '../ConstraintUpdateManager';
import { UserConstraints, UserConstraintUpdates, UserSession, TechnicalOption } from '../../types';

describe('ConstraintUpdateManager', () => {
  let updateManager: ConstraintUpdateManagerImpl;
  let mockSession: UserSession;
  let mockOptions: TechnicalOption[];

  beforeEach(() => {
    updateManager = new ConstraintUpdateManagerImpl();
    
    mockOptions = [
      {
        name: 'AWS',
        category: 'cloud',
        metadata: { pricing: 'pay-as-you-go', services: 200 }
      },
      {
        name: 'GCP',
        category: 'cloud', 
        metadata: { pricing: 'pay-as-you-go', services: 150 }
      }
    ];

    mockSession = {
      id: 'test-session-1',
      constraints: {
        budget: 'medium',
        scale: { users: 1000, traffic: 'medium' },
        team: { skillLevel: 'mixed', experience: ['javascript'] },
        timeline: 'medium',
        priorities: {
          cost: 3,
          performance: 4,
          easeOfUse: 3,
          scalability: 4,
          vendorLockIn: 2
        }
      },
      selectedOptions: mockOptions,
      evaluationHistory: [],
      createdAt: new Date()
    };

    updateManager.setSession(mockSession.id, mockSession);
  });

  describe('updateConstraints', () => {
    it('should successfully update budget constraint', async () => {
      const updates = { budget: 'high' as const };
      
      const result = await updateManager.updateConstraints(mockSession.id, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedConstraints.budget).toBe('high');
      expect(result.changesSummary).toContain('Budget changed from medium to high');
      expect(result.errors).toHaveLength(0);
    });

    it('should successfully update priorities and trigger re-evaluation', async () => {
      const updates = { 
        priorities: {
          cost: 5,
          performance: 4,
          easeOfUse: 3,
          scalability: 4,
          vendorLockIn: 2
        }
      };
      
      const result = await updateManager.updateConstraints(mockSession.id, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedConstraints.priorities.cost).toBe(5);
      expect(result.evaluationResult).toBeDefined(); // Should have re-evaluation result
      expect(result.changesSummary).toContain('cost priority changed from 3 to 5');
    });

    it('should update scale information', async () => {
      const updates = { 
        scale: { users: 10000, traffic: 'high' as const }
      };
      
      const result = await updateManager.updateConstraints(mockSession.id, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedConstraints.scale.users).toBe(10000);
      expect(result.updatedConstraints.scale.traffic).toBe('high');
      expect(result.changesSummary).toContain('Expected users changed from 1000 to 10000');
      expect(result.changesSummary).toContain('Traffic level changed from medium to high');
    });

    it('should update team information', async () => {
      const updates = { 
        team: { 
          skillLevel: 'senior' as const, 
          experience: ['javascript', 'typescript', 'aws'] 
        }
      };
      
      const result = await updateManager.updateConstraints(mockSession.id, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedConstraints.team.skillLevel).toBe('senior');
      expect(result.updatedConstraints.team.experience).toEqual(['javascript', 'typescript', 'aws']);
      expect(result.changesSummary).toContain('Team skill level changed from mixed to senior');
    });

    it('should fail for non-existent session', async () => {
      const updates = { budget: 'high' as const };
      
      const result = await updateManager.updateConstraints('non-existent', updates);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('SESSION_NOT_FOUND');
    });

    it('should validate constraint updates', async () => {
      const invalidUpdates = { 
        priorities: {
          cost: 10, // Invalid - should be 1-5
          performance: 4,
          easeOfUse: 3,
          scalability: 4,
          vendorLockIn: 2
        }
      };
      
      const result = await updateManager.updateConstraints(mockSession.id, invalidUpdates);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('updatePriorities', () => {
    it('should update priorities specifically', async () => {
      const newPriorities = {
        cost: 5,
        performance: 3,
        easeOfUse: 4,
        scalability: 2,
        vendorLockIn: 1
      };
      
      const result = await updateManager.updatePriorities(mockSession.id, newPriorities);
      
      expect(result.success).toBe(true);
      expect(result.updatedConstraints.priorities).toEqual(newPriorities);
      expect(result.evaluationResult).toBeDefined();
    });
  });

  describe('validateConstraintUpdates', () => {
    it('should validate valid updates', () => {
      const updates = { budget: 'high' as const };
      
      const result = updateManager.validateConstraintUpdates(mockSession.constraints, updates);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid updates', () => {
      const invalidUpdates = { 
        budget: 'invalid' as any
      };
      
      const result = updateManager.validateConstraintUpdates(mockSession.constraints, invalidUpdates);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about significant priority changes', () => {
      const updates = { 
        priorities: {
          cost: 1, // Significant decrease from 3
          performance: 4,
          easeOfUse: 3,
          scalability: 4,
          vendorLockIn: 2
        }
      };
      
      const result = updateManager.validateConstraintUpdates(mockSession.constraints, updates);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Significant priority changes'))).toBe(true);
    });

    it('should warn about significant scale changes', () => {
      const updates = { 
        scale: { users: 100000, traffic: 'high' as const } // 100x increase
      };
      
      const result = updateManager.validateConstraintUpdates(mockSession.constraints, updates);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Scale changes may significantly affect'))).toBe(true);
    });
  });

  describe('getModificationHistory', () => {
    it('should track modification history', async () => {
      // Make a few updates
      await updateManager.updateConstraints(mockSession.id, { budget: 'high' as const });
      await updateManager.updateConstraints(mockSession.id, { timeline: 'short' as const });
      
      const history = updateManager.getModificationHistory(mockSession.id);
      
      expect(history).toHaveLength(2);
      expect(history[0]?.modifiedFields).toContain('budget');
      expect(history[1]?.modifiedFields).toContain('timeline');
      expect(history[0]?.newValues.budget).toBe('high');
      expect(history[1]?.newValues.timeline).toBe('short');
    });

    it('should return empty history for new session', () => {
      const history = updateManager.getModificationHistory('new-session');
      
      expect(history).toHaveLength(0);
    });
  });

  describe('mergeConstraints', () => {
    it('should properly merge nested objects', async () => {
      const updates: UserConstraintUpdates = { 
        scale: { users: 5000 } // Only update users, traffic should be preserved
      };
      
      const result = await updateManager.updateConstraints(mockSession.id, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedConstraints.scale.users).toBe(5000);
      expect(result.updatedConstraints.scale.traffic).toBe('medium'); // Should preserve original
    });

    it('should handle partial priority updates', async () => {
      const updates: UserConstraintUpdates = { 
        priorities: { cost: 5 } // Only update cost priority
      };
      
      const result = await updateManager.updateConstraints(mockSession.id, updates);
      
      expect(result.success).toBe(true);
      expect(result.updatedConstraints.priorities.cost).toBe(5);
      expect(result.updatedConstraints.priorities.performance).toBe(4); // Should preserve original
    });
  });
});