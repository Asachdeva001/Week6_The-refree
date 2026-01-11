/**
 * Tests for ConstraintCollector component
 * Feature: technical-referee, Constraint validation and processing
 */

import { ConstraintCollector } from '../ConstraintCollector';
import { UserConstraints } from '../../types';

describe('ConstraintCollector', () => {
  let collector: ConstraintCollector;

  beforeEach(() => {
    collector = new ConstraintCollector();
  });

  describe('validateConstraints', () => {
    const validConstraints: UserConstraints = {
      budget: 'medium',
      scale: {
        users: 1000,
        traffic: 'medium',
      },
      team: {
        skillLevel: 'mixed',
        experience: ['javascript', 'python'],
      },
      timeline: 'medium',
      priorities: {
        cost: 3,
        performance: 4,
        easeOfUse: 3,
        scalability: 4,
        vendorLockIn: 2,
      },
    };

    test('should validate correct constraints', () => {
      const result = collector.validateConstraints(validConstraints);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid budget', () => {
      const invalidConstraints = {
        ...validConstraints,
        budget: 'invalid' as any,
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'budget',
        message: 'Budget must be one of: low, medium, high',
        code: 'BUDGET_INVALID',
      });
    });

    test('should reject missing budget', () => {
      const invalidConstraints = {
        ...validConstraints,
        budget: '' as any,
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'budget',
        message: 'Budget level is required',
        code: 'BUDGET_REQUIRED',
      });
    });

    test('should reject negative user count', () => {
      const invalidConstraints = {
        ...validConstraints,
        scale: {
          ...validConstraints.scale,
          users: -100,
        },
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'scale.users',
        message: 'User count cannot be negative',
        code: 'USERS_NEGATIVE',
      });
    });

    test('should warn about zero users', () => {
      const constraintsWithZeroUsers = {
        ...validConstraints,
        scale: {
          ...validConstraints.scale,
          users: 0,
        },
      };
      
      const result = collector.validateConstraints(constraintsWithZeroUsers);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('User count is zero - consider if this is realistic for your use case');
    });

    test('should warn about very high user count', () => {
      const constraintsWithHighUsers = {
        ...validConstraints,
        scale: {
          ...validConstraints.scale,
          users: 2000000,
        },
      };
      
      const result = collector.validateConstraints(constraintsWithHighUsers);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Very high user count detected - ensure scalability is prioritized');
    });

    test('should reject invalid traffic level', () => {
      const invalidConstraints = {
        ...validConstraints,
        scale: {
          ...validConstraints.scale,
          traffic: 'extreme' as any,
        },
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'scale.traffic',
        message: 'Traffic must be one of: low, medium, high',
        code: 'TRAFFIC_INVALID',
      });
    });

    test('should reject invalid skill level', () => {
      const invalidConstraints = {
        ...validConstraints,
        team: {
          ...validConstraints.team,
          skillLevel: 'expert' as any,
        },
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'team.skillLevel',
        message: 'Skill level must be one of: junior, mixed, senior',
        code: 'SKILL_LEVEL_INVALID',
      });
    });

    test('should warn about junior team with no experience', () => {
      const constraintsJuniorNoExp = {
        ...validConstraints,
        team: {
          skillLevel: 'junior' as const,
          experience: [],
        },
      };
      
      const result = collector.validateConstraints(constraintsJuniorNoExp);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Junior team with no listed experience - consider prioritizing ease of use');
    });

    test('should reject invalid experience entries', () => {
      const invalidConstraints = {
        ...validConstraints,
        team: {
          ...validConstraints.team,
          experience: ['javascript', '', 'python'] as any,
        },
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'team.experience[1]',
        message: 'Experience entries must be non-empty strings',
        code: 'EXPERIENCE_ENTRY_INVALID',
      });
    });

    test('should reject invalid timeline', () => {
      const invalidConstraints = {
        ...validConstraints,
        timeline: 'never' as any,
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'timeline',
        message: 'Timeline must be one of: immediate, short, medium, long',
        code: 'TIMELINE_INVALID',
      });
    });

    test('should warn about immediate timeline', () => {
      const immediateConstraints = {
        ...validConstraints,
        timeline: 'immediate' as const,
      };
      
      const result = collector.validateConstraints(immediateConstraints);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Immediate timeline may limit technology options - consider prioritizing ease of use');
    });

    test('should reject priority values out of range', () => {
      const invalidConstraints = {
        ...validConstraints,
        priorities: {
          ...validConstraints.priorities,
          cost: 6,
          performance: 0,
        },
      };
      
      const result = collector.validateConstraints(invalidConstraints);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'priorities.cost',
        message: 'cost priority must be between 1 and 5',
        code: 'PRIORITY_OUT_OF_RANGE',
      });
      expect(result.errors).toContainEqual({
        field: 'priorities.performance',
        message: 'performance priority must be between 1 and 5',
        code: 'PRIORITY_OUT_OF_RANGE',
      });
    });

    test('should warn about all equal priorities', () => {
      const equalPriorities = {
        ...validConstraints,
        priorities: {
          cost: 3,
          performance: 3,
          easeOfUse: 3,
          scalability: 3,
          vendorLockIn: 3,
        },
      };
      
      const result = collector.validateConstraints(equalPriorities);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('All priorities have the same weight - consider differentiating based on your specific needs');
    });
  });

  describe('normalizePriorities', () => {
    test('should normalize priorities to sum to 1', () => {
      const priorities = {
        cost: 2,
        performance: 4,
        easeOfUse: 1,
        scalability: 3,
        vendorLockIn: 5,
      };
      
      const normalized = collector.normalizePriorities(priorities);
      
      const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
      
      // Check proportions are correct
      expect(normalized.performance).toBeCloseTo(4/15, 5);
      expect(normalized.vendorLockIn).toBeCloseTo(5/15, 5);
      expect(normalized.easeOfUse).toBeCloseTo(1/15, 5);
    });

    test('should handle zero total with equal weights', () => {
      const zeroPriorities = {
        cost: 0,
        performance: 0,
        easeOfUse: 0,
        scalability: 0,
        vendorLockIn: 0,
      };
      
      const normalized = collector.normalizePriorities(zeroPriorities);
      
      expect(normalized.cost).toBe(0.2);
      expect(normalized.performance).toBe(0.2);
      expect(normalized.easeOfUse).toBe(0.2);
      expect(normalized.scalability).toBe(0.2);
      expect(normalized.vendorLockIn).toBe(0.2);
    });
  });

  describe('sanitizeInput', () => {
    test('should remove dangerous characters from strings', () => {
      const dangerous = '<script>alert("xss")</script>';
      const sanitized = collector.sanitizeInput(dangerous);
      
      expect(sanitized).toBe('scriptalert(xss)/script');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
    });

    test('should limit string length', () => {
      const longString = 'a'.repeat(200);
      const sanitized = collector.sanitizeInput(longString);
      
      expect(sanitized).toHaveLength(100);
    });

    test('should sanitize arrays recursively', () => {
      const input = ['<script>', 'safe', '"dangerous"'];
      const sanitized = collector.sanitizeInput(input);
      
      expect(sanitized).toEqual(['script', 'safe', 'dangerous']);
    });

    test('should sanitize objects recursively', () => {
      const input = {
        '<script>': 'value',
        safe: '"dangerous"',
        nested: {
          '<bad>': 'value',
        },
      };
      
      const sanitized = collector.sanitizeInput(input);
      
      expect(sanitized).toEqual({
        'script': 'value',
        safe: 'dangerous',
        nested: {
          'bad': 'value',
        },
      });
    });

    test('should preserve non-string types', () => {
      expect(collector.sanitizeInput(123)).toBe(123);
      expect(collector.sanitizeInput(true)).toBe(true);
      expect(collector.sanitizeInput(null)).toBe(null);
    });
  });
});