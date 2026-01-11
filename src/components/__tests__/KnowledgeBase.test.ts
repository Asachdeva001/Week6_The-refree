/**
 * Tests for KnowledgeBase component
 */

import { KnowledgeBase } from '../KnowledgeBase';
import { TechnicalOption } from '../../types/core';
import { STANDARD_CRITERIA } from '../../types/knowledge';

describe('KnowledgeBase', () => {
  let knowledgeBase: KnowledgeBase;

  beforeEach(() => {
    knowledgeBase = new KnowledgeBase();
  });

  describe('Basic functionality', () => {
    test('should return available categories', () => {
      const categories = knowledgeBase.getAvailableCategories();
      expect(categories).toContain('cloud');
      expect(categories).toContain('backend');
      expect(categories).toContain('database');
    });

    test('should return criteria for known categories', () => {
      const cloudCriteria = knowledgeBase.getCriteriaForCategory('cloud');
      expect(cloudCriteria).toHaveLength(6);
      expect(cloudCriteria.map(c => c.name)).toEqual([
        STANDARD_CRITERIA.COST,
        STANDARD_CRITERIA.PERFORMANCE,
        STANDARD_CRITERIA.SCALABILITY,
        STANDARD_CRITERIA.LEARNING_CURVE,
        STANDARD_CRITERIA.VENDOR_LOCK_IN,
        STANDARD_CRITERIA.MAINTAINABILITY
      ]);
    });

    test('should return generic criteria for unknown categories', () => {
      const unknownCriteria = knowledgeBase.getCriteriaForCategory('unknown' as any);
      expect(unknownCriteria).toHaveLength(6);
      // All scoring functions should return neutral score of 50
      unknownCriteria.forEach(criterion => {
        expect(criterion.scoringFunction({} as TechnicalOption)).toBe(50);
      });
    });
  });

  describe('Technology recognition', () => {
    test('should recognize known cloud providers', () => {
      const awsOption: TechnicalOption = {
        name: 'AWS',
        category: 'cloud',
        metadata: {}
      };
      expect(knowledgeBase.isKnownTechnology(awsOption)).toBe(true);
    });

    test('should not recognize unknown technologies', () => {
      const unknownOption: TechnicalOption = {
        name: 'UnknownTech',
        category: 'cloud',
        metadata: {}
      };
      expect(knowledgeBase.isKnownTechnology(unknownOption)).toBe(false);
    });
  });

  describe('Scoring functionality', () => {
    test('should evaluate cloud provider options', () => {
      const awsOption: TechnicalOption = {
        name: 'AWS',
        category: 'cloud',
        metadata: {
          name: 'AWS',
          pricingModel: 'pay-as-you-go',
          serviceCount: 200,
          enterpriseFeatures: ['IAM', 'CloudTrail', 'Config'],
          learningCurve: 'high',
          marketShare: 32,
          regions: 25,
          certifications: ['SOC', 'ISO']
        }
      };

      const scores = knowledgeBase.evaluateOption(awsOption);
      expect(scores).toHaveProperty(STANDARD_CRITERIA.COST);
      expect(scores).toHaveProperty(STANDARD_CRITERIA.PERFORMANCE);
      expect(scores).toHaveProperty(STANDARD_CRITERIA.SCALABILITY);
      expect(scores).toHaveProperty(STANDARD_CRITERIA.LEARNING_CURVE);
      expect(scores).toHaveProperty(STANDARD_CRITERIA.VENDOR_LOCK_IN);
      expect(scores).toHaveProperty(STANDARD_CRITERIA.MAINTAINABILITY);

      // All scores should be between 0 and 100
      Object.values(scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    test('should apply scoring rule adjustments', () => {
      const highMarketShareOption: TechnicalOption = {
        name: 'AWS',
        category: 'cloud',
        metadata: {
          name: 'AWS',
          pricingModel: 'pay-as-you-go',
          serviceCount: 200,
          enterpriseFeatures: ['IAM', 'CloudTrail'],
          learningCurve: 'high',
          marketShare: 35, // High market share
          regions: 25,
          certifications: ['SOC']
        }
      };

      const baseScores = knowledgeBase.evaluateOption(highMarketShareOption);
      const adjustedScores = knowledgeBase.applyScoreAdjustments(highMarketShareOption, baseScores);

      // High market share should boost learning curve and maintainability scores
      expect(adjustedScores[STANDARD_CRITERIA.LEARNING_CURVE]).toBeGreaterThanOrEqual(baseScores[STANDARD_CRITERIA.LEARNING_CURVE] || 0);
      expect(adjustedScores[STANDARD_CRITERIA.MAINTAINABILITY]).toBeGreaterThanOrEqual(baseScores[STANDARD_CRITERIA.MAINTAINABILITY] || 0);
    });
  });

  describe('Metadata validation', () => {
    test('should validate cloud provider metadata', () => {
      const validOption: TechnicalOption = {
        name: 'AWS',
        category: 'cloud',
        metadata: {
          name: 'AWS',
          pricingModel: 'pay-as-you-go',
          serviceCount: 200,
          enterpriseFeatures: [],
          learningCurve: 'high',
          marketShare: 32,
          regions: 25,
          certifications: []
        }
      };

      const validation = knowledgeBase.validateOptionMetadata(validOption);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidOption: TechnicalOption = {
        name: 'AWS',
        category: 'cloud',
        metadata: {
          name: 'AWS',
          // Missing required fields
        }
      };

      const validation = knowledgeBase.validateOptionMetadata(invalidOption);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Sample technologies', () => {
    test('should provide sample technologies for all categories', () => {
      const samples = knowledgeBase.getSampleTechnologies();
      expect(samples).toHaveProperty('cloud');
      expect(samples).toHaveProperty('backend');
      expect(samples).toHaveProperty('database');

      expect(samples.cloud?.length).toBeGreaterThan(0);
      expect(samples.backend?.length).toBeGreaterThan(0);
      expect(samples.database?.length).toBeGreaterThan(0);
    });

    test('should provide valid sample data', () => {
      const samples = knowledgeBase.getSampleTechnologies();
      
      // Test that sample cloud providers have valid metadata
      samples.cloud?.forEach(option => {
        const validation = knowledgeBase.validateOptionMetadata(option);
        expect(validation.isValid).toBe(true);
      });

      // Test that sample backend frameworks have valid metadata
      samples.backend?.forEach(option => {
        const validation = knowledgeBase.validateOptionMetadata(option);
        expect(validation.isValid).toBe(true);
      });

      // Test that sample databases have valid metadata
      samples.database?.forEach(option => {
        const validation = knowledgeBase.validateOptionMetadata(option);
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('Fallback behavior', () => {
    test('should provide fallback metadata for unknown technologies', () => {
      const unknownOption: TechnicalOption = {
        name: 'UnknownCloud',
        category: 'cloud',
        metadata: {}
      };

      const metadata = knowledgeBase.getTechnologyMetadata(unknownOption);
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('pricingModel');
      expect(metadata).toHaveProperty('serviceCount');
    });

    test('should handle scoring errors gracefully', () => {
      const malformedOption: TechnicalOption = {
        name: 'Malformed',
        category: 'cloud',
        metadata: {} // Empty metadata instead of null
      };

      // Should not throw an error
      expect(() => {
        const scores = knowledgeBase.evaluateOption(malformedOption);
        expect(typeof scores).toBe('object');
      }).not.toThrow();
    });
  });
});