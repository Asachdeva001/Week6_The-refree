/**
 * Tests for ComparisonEngine component
 * Focuses on option validation and processing functionality
 */

import { ComparisonEngine } from '../ComparisonEngine';
import { TechnicalOption } from '../../types';
import { STANDARD_CRITERIA } from '../../types/knowledge';

describe('ComparisonEngine', () => {
  let engine: ComparisonEngine;

  beforeEach(() => {
    engine = new ComparisonEngine();
  });

  describe('validateOptionCount', () => {
    it('should accept exactly 2 options', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'GCP', category: 'cloud', metadata: {} },
      ];

      const result = engine.validateOptionCount(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept exactly 3 options', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'GCP', category: 'cloud', metadata: {} },
        { name: 'Azure', category: 'cloud', metadata: {} },
      ];

      const result = engine.validateOptionCount(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject fewer than 2 options', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
      ];

      const result = engine.validateOptionCount(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('OPTIONS_TOO_FEW');
    });

    it('should reject more than 3 options', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'GCP', category: 'cloud', metadata: {} },
        { name: 'Azure', category: 'cloud', metadata: {} },
        { name: 'DigitalOcean', category: 'cloud', metadata: {} },
      ];

      const result = engine.validateOptionCount(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('OPTIONS_TOO_MANY');
    });

    it('should reject non-array input', () => {
      const result = engine.validateOptionCount('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('OPTIONS_INVALID_TYPE');
    });
  });

  describe('validateTechnicalOptions', () => {
    it('should validate complete valid options', () => {
      const options: TechnicalOption[] = [
        { 
          name: 'AWS', 
          category: 'cloud', 
          metadata: { 
            pricingModel: 'pay-as-you-go',
            serviceCount: 200,
            learningCurve: 'high',
            marketShare: 32,
            regions: 25
          } 
        },
        { 
          name: 'GCP', 
          category: 'cloud', 
          metadata: { 
            pricingModel: 'pay-as-you-go',
            serviceCount: 100,
            learningCurve: 'medium',
            marketShare: 9,
            regions: 24
          } 
        },
      ];

      const result = engine.validateTechnicalOptions(options);
      expect(result.isValid).toBe(true);
    });

    it('should reject options with missing names', () => {
      const options: TechnicalOption[] = [
        { name: '', category: 'cloud', metadata: {} },
        { name: 'GCP', category: 'cloud', metadata: {} },
      ];

      const result = engine.validateTechnicalOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'OPTION_NAME_EMPTY')).toBe(true);
    });

    it('should reject options with invalid categories', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'InvalidTech', category: '' as any, metadata: {} },
      ];

      const result = engine.validateTechnicalOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'OPTION_CATEGORY_INVALID')).toBe(true);
    });

    it('should reject duplicate options', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'AWS', category: 'cloud', metadata: {} },
      ];

      const result = engine.validateTechnicalOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'OPTION_DUPLICATE')).toBe(true);
    });

    it('should warn about mixed categories', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'Node.js', category: 'backend', metadata: {} },
      ];

      const result = engine.validateTechnicalOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Mixed categories'))).toBe(true);
    });

    it('should warn about unknown categories', () => {
      const options: TechnicalOption[] = [
        { name: 'UnknownTech', category: 'unknown' as any, metadata: {} },
        { name: 'AnotherTech', category: 'unknown' as any, metadata: {} },
      ];

      const result = engine.validateTechnicalOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('unknown category'))).toBe(true);
    });
  });

  describe('processOptions', () => {
    it('should return known options unchanged', () => {
      const options: TechnicalOption[] = [
        { 
          name: 'AWS', 
          category: 'cloud', 
          metadata: { 
            pricingModel: 'pay-as-you-go',
            serviceCount: 200,
            learningCurve: 'high',
            marketShare: 32,
            regions: 25
          } 
        },
      ];

      const processed = engine.processOptions(options);
      expect(processed[0]).toEqual(options[0]);
    });

    it('should enrich unknown options with fallback metadata', () => {
      const options: TechnicalOption[] = [
        { name: 'UnknownCloud', category: 'cloud', metadata: {} },
      ];

      const processed = engine.processOptions(options);
      expect(processed[0]?.metadata).toHaveProperty('pricingModel');
      expect(processed[0]?.metadata).toHaveProperty('serviceCount');
      expect(processed[0]?.metadata).toHaveProperty('learningCurve');
    });

    it('should preserve user-provided metadata over fallbacks', () => {
      const options: TechnicalOption[] = [
        { 
          name: 'UnknownCloud', 
          category: 'cloud', 
          metadata: { 
            pricingModel: 'reserved',
            customField: 'custom value'
          } 
        },
      ];

      const processed = engine.processOptions(options);
      expect(processed[0]?.metadata.pricingModel).toBe('reserved');
      expect(processed[0]?.metadata.customField).toBe('custom value');
      expect(processed[0]?.metadata).toHaveProperty('serviceCount'); // fallback added
    });
  });

  describe('evaluate', () => {
    it('should throw error for invalid options', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
      ]; // Only 1 option - invalid

      const constraints = {
        budget: 'medium' as const,
        scale: { users: 1000, traffic: 'medium' as const },
        team: { skillLevel: 'mixed' as const, experience: ['aws'] },
        timeline: 'short' as const,
        priorities: { cost: 3, performance: 4, easeOfUse: 2, scalability: 5, vendorLockIn: 1 },
      };

      expect(() => engine.evaluate(options, constraints)).toThrow('Invalid options');
    });

    it('should successfully evaluate valid options', () => {
      const options: TechnicalOption[] = [
        { 
          name: 'AWS', 
          category: 'cloud', 
          metadata: {
            pricingModel: 'pay-as-you-go',
            serviceCount: 200,
            enterpriseFeatures: ['IAM', 'CloudTrail'],
            learningCurve: 'high',
            marketShare: 32,
            regions: 25,
            certifications: ['SOC', 'ISO']
          }
        },
        { 
          name: 'GCP', 
          category: 'cloud', 
          metadata: {
            pricingModel: 'pay-as-you-go',
            serviceCount: 100,
            enterpriseFeatures: ['IAM'],
            learningCurve: 'medium',
            marketShare: 9,
            regions: 24,
            certifications: ['SOC']
          }
        },
      ];

      const constraints = {
        budget: 'medium' as const,
        scale: { users: 1000, traffic: 'medium' as const },
        team: { skillLevel: 'mixed' as const, experience: ['aws'] },
        timeline: 'short' as const,
        priorities: { cost: 3, performance: 4, easeOfUse: 2, scalability: 5, vendorLockIn: 1 },
      };

      const result = engine.evaluate(options, constraints);
      
      expect(result.scores).toHaveLength(2);
      expect(result.rankings).toHaveLength(2);
      expect(result.tradeOffs).toBeDefined();
      
      // Check that scores have required properties
      result.scores.forEach(score => {
        expect(score.option).toBeDefined();
        expect(score.criteriaScores).toBeDefined();
        expect(typeof score.weightedScore).toBe('number');
        expect(typeof score.normalizedScore).toBe('number');
        expect(score.normalizedScore).toBeGreaterThanOrEqual(0);
        expect(score.normalizedScore).toBeLessThanOrEqual(100);
      });

      // Check that rankings are properly ordered
      expect(result.rankings[0]?.rank).toBe(1);
      expect(result.rankings[1]?.rank).toBe(2);
      expect(result.rankings[0]?.score).toBeGreaterThanOrEqual(result.rankings[1]?.score || 0);
    });

    it('should handle equal priority weights', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'GCP', category: 'cloud', metadata: {} },
      ];

      const constraints = {
        budget: 'medium' as const,
        scale: { users: 1000, traffic: 'medium' as const },
        team: { skillLevel: 'mixed' as const, experience: [] },
        timeline: 'short' as const,
        priorities: { cost: 3, performance: 3, easeOfUse: 3, scalability: 3, vendorLockIn: 3 },
      };

      const result = engine.evaluate(options, constraints);
      expect(result.scores).toHaveLength(2);
      expect(result.rankings).toHaveLength(2);
    });

    it('should apply priority emphasis correctly', () => {
      const options: TechnicalOption[] = [
        { 
          name: 'AWS', 
          category: 'cloud', 
          metadata: {
            pricingModel: 'reserved', // More expensive but better performance
            serviceCount: 200,
            learningCurve: 'high',
            marketShare: 32,
            regions: 25
          }
        },
        { 
          name: 'DigitalOcean', 
          category: 'cloud', 
          metadata: {
            pricingModel: 'pay-as-you-go', // Cheaper but less performant
            serviceCount: 50,
            learningCurve: 'low',
            marketShare: 3,
            regions: 8
          }
        },
      ];

      // High cost priority should favor cost-effective options (DigitalOcean)
      const costFocusedConstraints = {
        budget: 'low' as const,
        scale: { users: 100, traffic: 'low' as const },
        team: { skillLevel: 'junior' as const, experience: [] },
        timeline: 'immediate' as const,
        priorities: { cost: 5, performance: 1, easeOfUse: 5, scalability: 1, vendorLockIn: 1 },
      };

      const costResult = engine.evaluate(options, costFocusedConstraints);

      // High performance priority should favor performant options (AWS)
      const performanceFocusedConstraints = {
        budget: 'high' as const,
        scale: { users: 100000, traffic: 'high' as const },
        team: { skillLevel: 'senior' as const, experience: ['AWS'] },
        timeline: 'long' as const,
        priorities: { cost: 1, performance: 5, easeOfUse: 1, scalability: 5, vendorLockIn: 1 },
      };

      const performanceResult = engine.evaluate(options, performanceFocusedConstraints);

      // Cost-focused should prefer DigitalOcean, performance-focused should prefer AWS
      expect(costResult.rankings[0]?.option.name).toBe('DigitalOcean');
      expect(performanceResult.rankings[0]?.option.name).toBe('AWS');
    });

    it('should apply contextual adjustments based on team experience', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: {} },
        { name: 'GCP', category: 'cloud', metadata: {} },
      ];

      const constraintsWithAWSExperience = {
        budget: 'medium' as const,
        scale: { users: 1000, traffic: 'medium' as const },
        team: { skillLevel: 'mixed' as const, experience: ['AWS', 'Docker'] },
        timeline: 'short' as const,
        priorities: { cost: 3, performance: 3, easeOfUse: 3, scalability: 3, vendorLockIn: 3 },
      };

      const result = engine.evaluate(options, constraintsWithAWSExperience);
      
      // AWS should get a boost due to team experience
      const awsScore = result.scores.find(s => s.option.name === 'AWS');
      const gcpScore = result.scores.find(s => s.option.name === 'GCP');
      
      expect(awsScore).toBeDefined();
      expect(gcpScore).toBeDefined();
      
      // AWS should have higher learning curve score due to experience boost
      expect(awsScore?.criteriaScores[STANDARD_CRITERIA.LEARNING_CURVE])
        .toBeGreaterThan(gcpScore?.criteriaScores[STANDARD_CRITERIA.LEARNING_CURVE] || 0);
    });

    it('should apply timeline-based adjustments', () => {
      const options: TechnicalOption[] = [
        { name: 'AWS', category: 'cloud', metadata: { learningCurve: 'high' } },
        { name: 'GCP', category: 'cloud', metadata: { learningCurve: 'low' } },
      ];

      const immediateTimelineConstraints = {
        budget: 'medium' as const,
        scale: { users: 1000, traffic: 'medium' as const },
        team: { skillLevel: 'junior' as const, experience: [] },
        timeline: 'immediate' as const,
        priorities: { cost: 3, performance: 3, easeOfUse: 3, scalability: 3, vendorLockIn: 3 },
      };

      const result = engine.evaluate(options, immediateTimelineConstraints);
      
      // All options should get learning curve boost for immediate timeline
      result.scores.forEach(score => {
        expect(score.criteriaScores[STANDARD_CRITERIA.LEARNING_CURVE]).toBeGreaterThan(0);
      });
    });
  });
});