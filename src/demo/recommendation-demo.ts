/**
 * Demo script to test the recommendation engine functionality
 * Shows how the OutputGenerator creates recommendations and alternative scenarios
 */

import { OutputGenerator } from '../components/OutputGenerator';
import { 
  UserConstraints, 
  EvaluationResult, 
  TechnicalOption, 
  OptionScore,
  RankedOption,
  TradeOffAnalysis 
} from '../types';

// Create sample data for demonstration
const constraints: UserConstraints = {
  budget: 'medium',
  scale: {
    users: 75000,
    traffic: 'high',
  },
  team: {
    skillLevel: 'mixed',
    experience: ['JavaScript', 'Python', 'AWS'],
  },
  timeline: 'short',
  priorities: {
    cost: 3,
    performance: 5,
    easeOfUse: 4,
    scalability: 5,
    vendorLockIn: 2,
  },
};

const options: TechnicalOption[] = [
  {
    name: 'AWS Lambda + Node.js',
    category: 'backend',
    metadata: {
      developmentSpeed: 8,
      communitySize: 120000,
      performanceRating: 7,
      learningCurve: 'low',
      costTier: 'low',
      scalabilityRating: 9,
      vendorLockIn: 'high',
    },
  },
  {
    name: 'Google Cloud Run + Python',
    category: 'backend',
    metadata: {
      developmentSpeed: 7,
      communitySize: 90000,
      performanceRating: 8,
      learningCurve: 'medium',
      costTier: 'medium',
      scalabilityRating: 8,
      vendorLockIn: 'medium',
    },
  },
  {
    name: 'Kubernetes + Go',
    category: 'backend',
    metadata: {
      developmentSpeed: 5,
      communitySize: 70000,
      performanceRating: 9,
      learningCurve: 'high',
      costTier: 'high',
      scalabilityRating: 10,
      vendorLockIn: 'low',
    },
  },
];

const scores: OptionScore[] = [
  {
    option: options[0]!,
    criteriaScores: {
      cost: 90,
      performance: 75,
      scalability: 95,
      learningCurve: 85,
      vendorLockIn: 30,
      maintainability: 80,
    },
    weightedScore: 84.2,
    normalizedScore: 84,
  },
  {
    option: options[1]!,
    criteriaScores: {
      cost: 75,
      performance: 85,
      scalability: 85,
      learningCurve: 75,
      vendorLockIn: 60,
      maintainability: 85,
    },
    weightedScore: 79.5,
    normalizedScore: 80,
  },
  {
    option: options[2]!,
    criteriaScores: {
      cost: 60,
      performance: 95,
      scalability: 100,
      learningCurve: 50,
      vendorLockIn: 90,
      maintainability: 90,
    },
    weightedScore: 82.1,
    normalizedScore: 82,
  },
];

const rankings: RankedOption[] = [
  { option: options[0]!, rank: 1, score: 84 },
  { option: options[2]!, rank: 2, score: 82 },
  { option: options[1]!, rank: 3, score: 80 },
];

const tradeOffs: TradeOffAnalysis = {
  strongestOption: {
    cost: options[0]!,
    performance: options[2]!,
    scalability: options[2]!,
    learningCurve: options[0]!,
    vendorLockIn: options[2]!,
    maintainability: options[2]!,
  },
  weakestOption: {
    cost: options[2]!,
    performance: options[0]!,
    scalability: options[1]!,
    learningCurve: options[2]!,
    vendorLockIn: options[0]!,
    maintainability: options[0]!,
  },
  compromises: [],
};

const evaluationResult: EvaluationResult = {
  scores,
  rankings,
  tradeOffs,
};

// Test the recommendation engine
function demonstrateRecommendationEngine() {
  console.log('=== Technical Referee Recommendation Engine Demo ===\n');
  
  const outputGenerator = new OutputGenerator();
  const result = outputGenerator.generateComparison(evaluationResult, constraints);
  
  console.log('📊 COMPARISON TABLE');
  console.log('Headers:', result.comparisonTable.headers.join(' | '));
  result.comparisonTable.rows.forEach(row => {
    const values = result.comparisonTable.headers.map(header => row.values[header]).join(' | ');
    console.log(`${row.option.name}: ${values}`);
  });
  
  console.log('\n🎯 FINAL RECOMMENDATION');
  console.log(`Recommended: ${result.finalRecommendation.recommendedOption.name}`);
  console.log(`Confidence: ${Math.round(result.finalRecommendation.confidence * 100)}%`);
  console.log(`Reasoning: ${result.finalRecommendation.reasoning}`);
  console.log(`Key Factors: ${result.finalRecommendation.keyFactors.join(', ')}`);
  if (result.finalRecommendation.warnings.length > 0) {
    console.log(`Warnings: ${result.finalRecommendation.warnings.join('; ')}`);
  }
  
  console.log('\n⚖️ TRADE-OFF ANALYSIS');
  console.log(result.tradeOffExplanation);
  
  console.log('\n🔄 ALTERNATIVE SCENARIOS');
  result.alternativeScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.scenario}`);
    console.log(`   → ${scenario.recommendedOption.name}`);
    console.log(`   → ${scenario.reasoning}\n`);
  });
  
  console.log('✅ PROS & CONS');
  result.prosAndCons.forEach(pc => {
    console.log(`\n${pc.option.name}:`);
    console.log(`  Pros: ${pc.pros.join(', ')}`);
    console.log(`  Cons: ${pc.cons.join(', ')}`);
  });
}

// Run the demonstration
if (require.main === module) {
  demonstrateRecommendationEngine();
}

export { demonstrateRecommendationEngine };