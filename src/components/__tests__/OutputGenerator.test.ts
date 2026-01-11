/**
 * Tests for OutputGenerator component
 * Validates recommendation engine functionality
 */

import { OutputGenerator } from '../OutputGenerator';
import { 
  UserConstraints, 
  EvaluationResult, 
  TechnicalOption, 
  OptionScore,
  RankedOption,
  TradeOffAnalysis 
} from '../../types';

describe('OutputGenerator', () => {
  let outputGenerator: OutputGenerator;
  let mockConstraints: UserConstraints;
  let mockOptions: TechnicalOption[];
  let mockEvaluationResult: EvaluationResult;

  beforeEach(() => {
    outputGenerator = new OutputGenerator();
    
    mockConstraints = {
      budget: 'medium',
      scale: {
        users: 50000,
        traffic: 'medium',
      },
      team: {
        skillLevel: 'mixed',
        experience: ['JavaScript', 'Node.js'],
      },
      timeline: 'short',
      priorities: {
        cost: 3,
        performance: 5,
        easeOfUse: 4,
        scalability: 4,
        vendorLockIn: 2,
      },
    };

    mockOptions = [
      {
        name: 'Node.js',
        category: 'backend',
        metadata: {
          developmentSpeed: 8,
          communitySize: 100000,
          performanceRating: 7,
          learningCurve: 'low',
          costTier: 'low',
        },
      },
      {
        name: 'Django',
        category: 'backend',
        metadata: {
          developmentSpeed: 7,
          communitySize: 80000,
          performanceRating: 6,
          learningCurve: 'medium',
          costTier: 'low',
        },
      },
      {
        name: 'Spring Boot',
        category: 'backend',
        metadata: {
          developmentSpeed: 6,
          communitySize: 90000,
          performanceRating: 9,
          learningCurve: 'high',
          costTier: 'medium',
        },
      },
    ];

    const mockScores: OptionScore[] = [
      {
        option: mockOptions[0]!,
        criteriaScores: {
          cost: 85,
          performance: 75,
          scalability: 80,
          learningCurve: 90,
          vendorLockIn: 85,
          maintainability: 80,
        },
        weightedScore: 82.5,
        normalizedScore: 83,
      },
      {
        option: mockOptions[1]!,
        criteriaScores: {
          cost: 80,
          performance: 70,
          scalability: 75,
          learningCurve: 75,
          vendorLockIn: 90,
          maintainability: 85,
        },
        weightedScore: 75.8,
        normalizedScore: 76,
      },
      {
        option: mockOptions[2]!,
        criteriaScores: {
          cost: 70,
          performance: 95,
          scalability: 90,
          learningCurve: 60,
          vendorLockIn: 70,
          maintainability: 90,
        },
        weightedScore: 79.2,
        normalizedScore: 79,
      },
    ];

    const mockRankings: RankedOption[] = [
      { option: mockOptions[0]!, rank: 1, score: 83 },
      { option: mockOptions[2]!, rank: 2, score: 79 },
      { option: mockOptions[1]!, rank: 3, score: 76 },
    ];

    const mockTradeOffs: TradeOffAnalysis = {
      strongestOption: {
        cost: mockOptions[0]!,
        performance: mockOptions[2]!,
        scalability: mockOptions[2]!,
        learningCurve: mockOptions[0]!,
        vendorLockIn: mockOptions[1]!,
        maintainability: mockOptions[2]!,
      },
      weakestOption: {
        cost: mockOptions[2]!,
        performance: mockOptions[1]!,
        scalability: mockOptions[1]!,
        learningCurve: mockOptions[2]!,
        vendorLockIn: mockOptions[2]!,
        maintainability: mockOptions[0]!,
      },
      compromises: [],
    };

    mockEvaluationResult = {
      scores: mockScores,
      rankings: mockRankings,
      tradeOffs: mockTradeOffs,
    };
  });

  describe('generateComparison', () => {
    it('should generate complete comparison output', () => {
      const result = outputGenerator.generateComparison(mockEvaluationResult, mockConstraints);

      expect(result).toBeDefined();
      expect(result.comparisonTable).toBeDefined();
      expect(result.prosAndCons).toBeDefined();
      expect(result.tradeOffExplanation).toBeDefined();
      expect(result.finalRecommendation).toBeDefined();
      expect(result.alternativeScenarios).toBeDefined();
    });

    it('should generate final recommendation with reasoning', () => {
      const result = outputGenerator.generateComparison(mockEvaluationResult, mockConstraints);
      const recommendation = result.finalRecommendation;

      expect(recommendation.recommendedOption).toEqual(mockOptions[0]!); // Node.js should be recommended
      expect(recommendation.confidence).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
      expect(recommendation.reasoning).toContain('Node.js');
      expect(recommendation.keyFactors).toBeInstanceOf(Array);
      expect(recommendation.keyFactors.length).toBeGreaterThan(0);
      expect(recommendation.warnings).toBeInstanceOf(Array);
    });

    it('should generate alternative scenarios', () => {
      const result = outputGenerator.generateComparison(mockEvaluationResult, mockConstraints);
      const scenarios = result.alternativeScenarios;

      expect(scenarios).toBeInstanceOf(Array);
      expect(scenarios.length).toBeGreaterThan(0);
      
      scenarios.forEach(scenario => {
        expect(scenario.scenario).toBeDefined();
        expect(scenario.recommendedOption).toBeDefined();
        expect(scenario.reasoning).toBeDefined();
        expect(typeof scenario.scenario).toBe('string');
        expect(typeof scenario.reasoning).toBe('string');
      });
    });

    it('should include performance-focused alternative scenario', () => {
      const result = outputGenerator.generateComparison(mockEvaluationResult, mockConstraints);
      const scenarios = result.alternativeScenarios;

      const performanceScenario = scenarios.find(s => 
        s.scenario.toLowerCase().includes('performance') || 
        s.recommendedOption.name === 'Spring Boot'
      );

      expect(performanceScenario).toBeDefined();
      if (performanceScenario) {
        expect(performanceScenario.recommendedOption.name).toBe('Spring Boot');
        expect(performanceScenario.reasoning).toMatch(/performance|scalability/i);
      }
    });

    it('should generate trade-off explanation', () => {
      const result = outputGenerator.generateComparison(mockEvaluationResult, mockConstraints);
      const tradeOffExplanation = result.tradeOffExplanation;

      expect(typeof tradeOffExplanation).toBe('string');
      expect(tradeOffExplanation.length).toBeGreaterThan(0);
      expect(tradeOffExplanation).toContain('Node.js');
    });

    it('should generate pros and cons for each option', () => {
      const result = outputGenerator.generateComparison(mockEvaluationResult, mockConstraints);
      const prosAndCons = result.prosAndCons;

      expect(prosAndCons).toHaveLength(3);
      
      prosAndCons.forEach(pc => {
        expect(pc.option).toBeDefined();
        expect(pc.pros).toBeInstanceOf(Array);
        expect(pc.cons).toBeInstanceOf(Array);
        expect(pc.pros.length).toBeGreaterThan(0);
      });
    });
  });

  describe('recommendation confidence', () => {
    it('should have higher confidence when score gap is large', () => {
      // Create a scenario with a large score gap
      const largeGapScores = [...mockEvaluationResult.scores];
      largeGapScores[0]!.normalizedScore = 90;
      largeGapScores[1]!.normalizedScore = 60;
      largeGapScores[2]!.normalizedScore = 55;

      const largeGapRankings: RankedOption[] = [
        { option: mockOptions[0]!, rank: 1, score: 90 },
        { option: mockOptions[1]!, rank: 2, score: 60 },
        { option: mockOptions[2]!, rank: 3, score: 55 },
      ];

      const largeGapResult: EvaluationResult = {
        ...mockEvaluationResult,
        scores: largeGapScores,
        rankings: largeGapRankings,
      };

      const result = outputGenerator.generateComparison(largeGapResult, mockConstraints);
      expect(result.finalRecommendation.confidence).toBeGreaterThan(0.7);
    });

    it('should have lower confidence when options are very close', () => {
      // Create a scenario with very close scores
      const closeScores = [...mockEvaluationResult.scores];
      closeScores[0]!.normalizedScore = 78;
      closeScores[1]!.normalizedScore = 77;
      closeScores[2]!.normalizedScore = 76;

      const closeRankings: RankedOption[] = [
        { option: mockOptions[0]!, rank: 1, score: 78 },
        { option: mockOptions[1]!, rank: 2, score: 77 },
        { option: mockOptions[2]!, rank: 3, score: 76 },
      ];

      const closeResult: EvaluationResult = {
        ...mockEvaluationResult,
        scores: closeScores,
        rankings: closeRankings,
      };

      const result = outputGenerator.generateComparison(closeResult, mockConstraints);
      expect(result.finalRecommendation.confidence).toBeLessThan(0.7);
    });
  });
});