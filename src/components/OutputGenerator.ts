/**
 * Output Generator Component
 * Responsible for formatting evaluation results into structured output
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.4
 */

import {
  UserConstraints,
  EvaluationResult,
  ComparisonOutput,
  ComparisonTable,
  ComparisonTableRow,
  ProsCons,
  Recommendation,
  AlternativeScenario,
  TechnicalOption,
  OptionScore,
  OutputGenerator as IOutputGenerator,
} from '../types';
import { STANDARD_CRITERIA } from '../types/knowledge';

/**
 * Implementation of the Output Generator interface
 * Handles comparison table formatting, pros/cons generation, and recommendations
 */
export class OutputGenerator implements IOutputGenerator {
  
  /**
   * Generate complete comparison output from evaluation results
   * @param result - Evaluation result to format
   * @param constraints - User constraints for context
   * @returns Formatted comparison output
   */
  generateComparison(result: EvaluationResult, constraints: UserConstraints): ComparisonOutput {
    // Generate comparison table (Requirement 3.1)
    const comparisonTable = this.generateComparisonTable(result);
    
    // Generate pros and cons for each option (Requirement 3.2)
    const prosAndCons = this.generateProsAndCons(result);
    
    // Generate trade-off explanation (Requirement 3.3, 6.4)
    const tradeOffExplanation = this.generateTradeOffExplanation(result, constraints);
    
    // Generate final recommendation (Requirement 3.4, 6.1, 6.2)
    const finalRecommendation = this.generateRecommendation(result, constraints);
    
    // Generate alternative scenarios (Requirement 3.5, 6.2)
    const alternativeScenarios = this.generateAlternativeScenarios(result, constraints);

    return {
      comparisonTable,
      prosAndCons,
      tradeOffExplanation,
      finalRecommendation,
      alternativeScenarios,
    };
  }

  /**
   * Generate side-by-side comparison table
   * Requirement 3.1: Create a side-by-side comparison table
   * @param result - Evaluation result with scores
   * @returns Formatted comparison table
   */
  private generateComparisonTable(result: EvaluationResult): ComparisonTable {
    // Extract all criteria from the scores
    const allCriteria = new Set<string>();
    result.scores.forEach(score => {
      Object.keys(score.criteriaScores).forEach(criterion => allCriteria.add(criterion));
    });

    // Create headers with user-friendly names
    const headers = ['Option', ...Array.from(allCriteria).map(this.formatCriterionName), 'Overall Score'];

    // Create rows for each option
    const rows: ComparisonTableRow[] = result.scores.map(score => {
      const values: Record<string, string | number> = {
        'Option': score.option.name,
        'Overall Score': `${score.normalizedScore}/100`,
      };

      // Add criterion values
      for (const criterion of allCriteria) {
        const criterionName = this.formatCriterionName(criterion);
        const criterionScore = score.criteriaScores[criterion];
        
        if (criterionScore !== undefined) {
          values[criterionName] = this.formatCriterionScore(criterion, criterionScore);
        } else {
          values[criterionName] = 'N/A';
        }
      }

      return {
        option: score.option,
        values,
      };
    });

    // Sort rows by overall score (highest first)
    rows.sort((a, b) => {
      const scoreA = typeof a.values['Overall Score'] === 'string' 
        ? parseInt(a.values['Overall Score']!.split('/')[0]!) 
        : 0;
      const scoreB = typeof b.values['Overall Score'] === 'string' 
        ? parseInt(b.values['Overall Score']!.split('/')[0]!) 
        : 0;
      return scoreB - scoreA;
    });

    return {
      headers,
      rows,
    };
  }

  /**
   * Format criterion name for display
   * @param criterion - Internal criterion name
   * @returns User-friendly criterion name
   */
  private formatCriterionName(criterion: string): string {
    const nameMap: Record<string, string> = {
      [STANDARD_CRITERIA.COST]: 'Cost Effectiveness',
      [STANDARD_CRITERIA.PERFORMANCE]: 'Performance',
      [STANDARD_CRITERIA.SCALABILITY]: 'Scalability',
      [STANDARD_CRITERIA.LEARNING_CURVE]: 'Ease of Use',
      [STANDARD_CRITERIA.VENDOR_LOCK_IN]: 'Vendor Independence',
      [STANDARD_CRITERIA.MAINTAINABILITY]: 'Maintainability',
    };

    return nameMap[criterion] || this.capitalizeWords(criterion.replace(/_/g, ' '));
  }

  /**
   * Format criterion score for display
   * @param criterion - Criterion name
   * @param score - Raw score (0-100)
   * @returns Formatted score string
   */
  private formatCriterionScore(criterion: string, score: number): string {
    const roundedScore = Math.round(score);
    
    // Add descriptive labels for key criteria
    if (roundedScore >= 80) return `${roundedScore}/100 (Excellent)`;
    if (roundedScore >= 60) return `${roundedScore}/100 (Good)`;
    if (roundedScore >= 40) return `${roundedScore}/100 (Fair)`;
    if (roundedScore >= 20) return `${roundedScore}/100 (Poor)`;
    return `${roundedScore}/100 (Very Poor)`;
  }

  /**
   * Generate pros and cons for each option
   * Requirement 3.2: List specific pros and cons for each option
   * @param result - Evaluation result with scores
   * @returns Pros and cons for each option
   */
  private generateProsAndCons(result: EvaluationResult): ProsCons[] {
    return result.scores.map(score => this.generateOptionProsAndCons(score, result));
  }

  /**
   * Generate pros and cons for a single option
   * @param optionScore - Score for the option
   * @param result - Full evaluation result for comparison
   * @returns Pros and cons for this option
   */
  private generateOptionProsAndCons(optionScore: OptionScore, result: EvaluationResult): ProsCons {
    const pros: string[] = [];
    const cons: string[] = [];

    // Find criteria where this option excels (top 20% of scores)
    const allScores = result.scores;
    
    for (const [criterion, score] of Object.entries(optionScore.criteriaScores)) {
      const otherScores = allScores
        .filter(s => s.option.name !== optionScore.option.name)
        .map(s => s.criteriaScores[criterion] || 0);
      
      const maxOtherScore = Math.max(...otherScores);
      const minOtherScore = Math.min(...otherScores);
      const avgOtherScore = otherScores.reduce((sum, s) => sum + s, 0) / otherScores.length;

      const criterionName = this.formatCriterionName(criterion);

      // Identify strengths (significantly better than others)
      if (score > maxOtherScore + 10) {
        pros.push(`Superior ${criterionName.toLowerCase()} (${Math.round(score)}/100)`);
      } else if (score > avgOtherScore + 15) {
        pros.push(`Strong ${criterionName.toLowerCase()} (${Math.round(score)}/100)`);
      } else if (score >= 80) {
        pros.push(`Excellent ${criterionName.toLowerCase()} (${Math.round(score)}/100)`);
      }

      // Identify weaknesses (significantly worse than others)
      if (score < minOtherScore - 10) {
        cons.push(`Weak ${criterionName.toLowerCase()} (${Math.round(score)}/100)`);
      } else if (score < avgOtherScore - 15) {
        cons.push(`Below average ${criterionName.toLowerCase()} (${Math.round(score)}/100)`);
      } else if (score <= 30) {
        cons.push(`Poor ${criterionName.toLowerCase()} (${Math.round(score)}/100)`);
      }
    }

    // Add option-specific pros and cons based on metadata
    const specificProsAndCons = this.generateSpecificProsAndCons(optionScore.option);
    pros.push(...specificProsAndCons.pros);
    cons.push(...specificProsAndCons.cons);

    // Ensure we have at least some pros and cons
    if (pros.length === 0) {
      pros.push(`Overall score of ${optionScore.normalizedScore}/100`);
    }
    if (cons.length === 0 && optionScore.normalizedScore < 90) {
      cons.push('May not be the optimal choice for all use cases');
    }

    return {
      option: optionScore.option,
      pros: pros.slice(0, 5), // Limit to top 5 pros
      cons: cons.slice(0, 5), // Limit to top 5 cons
    };
  }

  /**
   * Generate option-specific pros and cons based on technology metadata
   * @param option - Technical option to analyze
   * @returns Technology-specific pros and cons
   */
  private generateSpecificProsAndCons(option: TechnicalOption): { pros: string[]; cons: string[] } {
    const pros: string[] = [];
    const cons: string[] = [];

    // Add category-specific insights
    switch (option.category) {
      case 'cloud':
        if (option.metadata.serviceCount > 200) {
          pros.push('Comprehensive service ecosystem');
        }
        if (option.metadata.marketShare > 30) {
          pros.push('Market leader with strong community');
        }
        if (option.metadata.enterpriseFeatures?.length > 10) {
          pros.push('Rich enterprise feature set');
        }
        break;

      case 'backend':
        if (option.metadata.developmentSpeed > 8) {
          pros.push('Rapid development capabilities');
        }
        if (option.metadata.communitySize > 50000) {
          pros.push('Large, active community');
        }
        if (option.metadata.performanceRating > 8) {
          pros.push('High performance runtime');
        }
        break;

      case 'database':
        if (option.metadata.queryCapabilities?.includes('complex')) {
          pros.push('Advanced query capabilities');
        }
        if (option.metadata.scalingPattern === 'horizontal') {
          pros.push('Excellent horizontal scaling');
        }
        break;
    }

    // Add general metadata-based insights
    if (option.metadata.learningCurve === 'low') {
      pros.push('Easy to learn and adopt');
    } else if (option.metadata.learningCurve === 'high') {
      cons.push('Steep learning curve');
    }

    if (option.metadata.vendorLockIn === 'high') {
      cons.push('High vendor lock-in risk');
    } else if (option.metadata.vendorLockIn === 'low') {
      pros.push('Low vendor lock-in risk');
    }

    return { pros, cons };
  }

  /**
   * Generate trade-off explanation
   * Requirement 3.3: Describe what each option optimizes for and what it sacrifices
   * Requirement 6.4: Quantify or qualify the impact of choosing one option over another
   * @param result - Evaluation result with trade-off analysis
   * @param constraints - User constraints for context
   * @returns Detailed trade-off explanation
   */
  private generateTradeOffExplanation(result: EvaluationResult, constraints: UserConstraints): string {
    const explanations: string[] = [];
    
    // Add overall trade-off summary
    explanations.push(this.generateOverallTradeOffSummary(result, constraints));
    
    // Add specific trade-offs for each option
    explanations.push('');
    explanations.push('**Detailed Trade-offs:**');
    
    for (const score of result.scores) {
      const optionTradeOffs = this.generateOptionTradeOffs(score, result, constraints);
      explanations.push(`\n**${score.option.name}:**`);
      explanations.push(optionTradeOffs);
    }
    
    // Add impact quantification
    explanations.push('');
    explanations.push(this.generateImpactQuantification(result, constraints));
    
    return explanations.join('\n');
  }

  /**
   * Generate overall trade-off summary
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Overall trade-off summary
   */
  private generateOverallTradeOffSummary(result: EvaluationResult, constraints: UserConstraints): string {
    const topOption = result.rankings[0];
    const secondOption = result.rankings[1];
    
    if (!topOption || !secondOption) {
      return 'Unable to generate trade-off analysis with insufficient options.';
    }

    const topScore = result.scores.find(s => s.option.name === topOption.option.name);
    const secondScore = result.scores.find(s => s.option.name === secondOption.option.name);
    
    if (!topScore || !secondScore) {
      return 'Unable to generate trade-off analysis due to missing score data.';
    }

    // Find the key differentiators
    const keyDifferences = this.findKeyDifferences(topScore, secondScore);
    const topPriority = this.getTopPriority(constraints.priorities);
    
    let summary = `**Trade-off Summary:**\n`;
    summary += `${topOption.option.name} ranks highest overall (${Math.round(topOption.score)}/100) `;
    summary += `compared to ${secondOption.option.name} (${Math.round(secondOption.score)}/100). `;
    
    if (keyDifferences.length > 0) {
      const firstDiff = keyDifferences[0]!;
      summary += `The key differentiator is ${firstDiff.criterion} where `;
      summary += `${firstDiff.winner} scores ${Math.round(firstDiff.winnerScore)} `;
      summary += `vs ${Math.round(firstDiff.loserScore)}. `;
    }
    
    summary += `Given your priority on ${this.formatCriterionName(topPriority)}, `;
    summary += `this aligns well with your requirements.`;
    
    return summary;
  }

  /**
   * Generate trade-offs for a specific option
   * @param optionScore - Score for the option
   * @param result - Full evaluation result
   * @param constraints - User constraints
   * @returns Trade-offs for this option
   */
  private generateOptionTradeOffs(
    optionScore: OptionScore, 
    result: EvaluationResult, 
    constraints: UserConstraints
  ): string {
    const tradeOffs: string[] = [];
    
    // What this option optimizes for (strengths)
    const strengths = this.identifyOptionStrengths(optionScore, result);
    if (strengths.length > 0) {
      tradeOffs.push(`• **Optimizes for:** ${strengths.join(', ')}`);
    }
    
    // What this option sacrifices (weaknesses)
    const sacrifices = this.identifyOptionSacrifices(optionScore, result);
    if (sacrifices.length > 0) {
      tradeOffs.push(`• **Sacrifices:** ${sacrifices.join(', ')}`);
    }
    
    // Context-specific considerations
    const contextualConsiderations = this.getContextualConsiderations(optionScore.option, constraints);
    if (contextualConsiderations.length > 0) {
      tradeOffs.push(`• **Considerations:** ${contextualConsiderations.join(', ')}`);
    }
    
    return tradeOffs.join('\n');
  }

  /**
   * Generate impact quantification
   * Requirement 6.4: Quantify or qualify the impact of choosing one option over another
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Impact quantification explanation
   */
  private generateImpactQuantification(result: EvaluationResult, constraints: UserConstraints): string {
    const impacts: string[] = [];
    impacts.push('**Impact Analysis:**');
    
    const topOption = result.rankings[0];
    const alternatives = result.rankings.slice(1);
    
    for (const alternative of alternatives) {
      const impact = this.quantifyOptionImpact(topOption, alternative, result, constraints);
      impacts.push(`• Choosing ${alternative.option.name} over ${topOption!.option.name}: ${impact}`);
    }
    
    // Add priority-specific impact analysis
    const priorityImpact = this.analyzePriorityImpact(result, constraints);
    if (priorityImpact) {
      impacts.push('');
      impacts.push(priorityImpact);
    }
    
    return impacts.join('\n');
  }

  /**
   * Find key differences between two options
   * @param option1 - First option score
   * @param option2 - Second option score
   * @returns Key differences with quantified gaps
   */
  private findKeyDifferences(option1: OptionScore, option2: OptionScore): Array<{
    criterion: string;
    winner: string;
    loser: string;
    winnerScore: number;
    loserScore: number;
    gap: number;
  }> {
    const differences: Array<{
      criterion: string;
      winner: string;
      loser: string;
      winnerScore: number;
      loserScore: number;
      gap: number;
    }> = [];
    
    // Compare all criteria
    const allCriteria = new Set([
      ...Object.keys(option1.criteriaScores),
      ...Object.keys(option2.criteriaScores),
    ]);
    
    for (const criterion of allCriteria) {
      const score1 = option1.criteriaScores[criterion] || 0;
      const score2 = option2.criteriaScores[criterion] || 0;
      const gap = Math.abs(score1 - score2);
      
      // Only consider significant differences (>15 points)
      if (gap > 15) {
        const winner = score1 > score2 ? option1.option.name : option2.option.name;
        const loser = score1 > score2 ? option2.option.name : option1.option.name;
        const winnerScore = Math.max(score1, score2);
        const loserScore = Math.min(score1, score2);
        
        differences.push({
          criterion: this.formatCriterionName(criterion),
          winner,
          loser,
          winnerScore,
          loserScore,
          gap,
        });
      }
    }
    
    // Sort by gap size (largest differences first)
    return differences.sort((a, b) => b.gap - a.gap);
  }

  /**
   * Get the top priority from user constraints
   * @param priorities - User priority weights
   * @returns Top priority criterion
   */
  private getTopPriority(priorities: UserConstraints['priorities']): string {
    const priorityEntries = Object.entries(priorities);
    const topPriority = priorityEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    // Map priority keys to criterion names
    const priorityToCriterion: Record<string, string> = {
      cost: STANDARD_CRITERIA.COST,
      performance: STANDARD_CRITERIA.PERFORMANCE,
      easeOfUse: STANDARD_CRITERIA.LEARNING_CURVE,
      scalability: STANDARD_CRITERIA.SCALABILITY,
      vendorLockIn: STANDARD_CRITERIA.VENDOR_LOCK_IN,
    };
    
    return priorityToCriterion[topPriority[0]] || topPriority[0];
  }

  /**
   * Identify what an option optimizes for (strengths)
   * @param optionScore - Option to analyze
   * @param result - Full evaluation result
   * @returns List of strengths
   */
  private identifyOptionStrengths(optionScore: OptionScore, result: EvaluationResult): string[] {
    const strengths: string[] = [];
    
    // Find criteria where this option is in the top tier
    for (const [criterion, score] of Object.entries(optionScore.criteriaScores)) {
      const allScoresForCriterion = result.scores.map(s => s.criteriaScores[criterion] || 0);
      const maxScore = Math.max(...allScoresForCriterion);
      const avgScore = allScoresForCriterion.reduce((sum, s) => sum + s, 0) / allScoresForCriterion.length;
      
      // Consider it a strength if it's the best or significantly above average
      if (score === maxScore && score > avgScore + 10) {
        strengths.push(this.formatCriterionName(criterion).toLowerCase());
      } else if (score > avgScore + 20) {
        strengths.push(this.formatCriterionName(criterion).toLowerCase());
      }
    }
    
    return strengths.slice(0, 3); // Limit to top 3 strengths
  }

  /**
   * Identify what an option sacrifices (weaknesses)
   * @param optionScore - Option to analyze
   * @param result - Full evaluation result
   * @returns List of sacrifices
   */
  private identifyOptionSacrifices(optionScore: OptionScore, result: EvaluationResult): string[] {
    const sacrifices: string[] = [];
    
    // Find criteria where this option is significantly below others
    for (const [criterion, score] of Object.entries(optionScore.criteriaScores)) {
      const allScoresForCriterion = result.scores.map(s => s.criteriaScores[criterion] || 0);
      const maxScore = Math.max(...allScoresForCriterion);
      const avgScore = allScoresForCriterion.reduce((sum, s) => sum + s, 0) / allScoresForCriterion.length;
      
      // Consider it a sacrifice if it's significantly below average or the worst
      if (score < avgScore - 15) {
        sacrifices.push(this.formatCriterionName(criterion).toLowerCase());
      } else if (score === Math.min(...allScoresForCriterion) && score < avgScore - 5) {
        sacrifices.push(this.formatCriterionName(criterion).toLowerCase());
      }
    }
    
    return sacrifices.slice(0, 3); // Limit to top 3 sacrifices
  }

  /**
   * Get contextual considerations for an option
   * @param option - Technical option
   * @param constraints - User constraints
   * @returns List of contextual considerations
   */
  private getContextualConsiderations(option: TechnicalOption, constraints: UserConstraints): string[] {
    const considerations: string[] = [];
    
    // Budget considerations
    if (constraints.budget === 'low' && option.metadata.costTier === 'high') {
      considerations.push('may exceed budget constraints');
    }
    
    // Timeline considerations
    if (constraints.timeline === 'immediate' && option.metadata.learningCurve === 'high') {
      considerations.push('requires significant learning time');
    }
    
    // Team experience considerations
    const hasExperience = constraints.team.experience.some(exp => 
      exp.toLowerCase().includes(option.name.toLowerCase())
    );
    if (!hasExperience && option.metadata.learningCurve === 'high') {
      considerations.push('team lacks experience with this technology');
    }
    
    // Scale considerations
    if (constraints.scale.users > 100000 && option.metadata.scalabilityRating < 7) {
      considerations.push('may struggle with high-scale requirements');
    }
    
    return considerations;
  }

  /**
   * Quantify the impact of choosing one option over another
   * @param topOption - Top-ranked option
   * @param alternative - Alternative option
   * @param result - Full evaluation result
   * @param constraints - User constraints
   * @returns Impact quantification string
   */
  private quantifyOptionImpact(
    topOption: any, 
    alternative: any, 
    result: EvaluationResult, 
    constraints: UserConstraints
  ): string {
    const scoreDifference = Math.round(topOption.score - alternative.score);
    
    if (scoreDifference < 5) {
      return `Minimal impact (${scoreDifference} point difference) - both options are very similar`;
    } else if (scoreDifference < 15) {
      return `Low impact (${scoreDifference} point difference) - minor trade-offs in specific areas`;
    } else if (scoreDifference < 30) {
      return `Moderate impact (${scoreDifference} point difference) - noticeable differences in key criteria`;
    } else {
      return `High impact (${scoreDifference} point difference) - significant compromises in multiple areas`;
    }
  }

  /**
   * Analyze impact based on user priorities
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Priority-specific impact analysis
   */
  private analyzePriorityImpact(result: EvaluationResult, constraints: UserConstraints): string | null {
    const topPriority = this.getTopPriority(constraints.priorities);
    const topOption = result.rankings[0];
    
    if (!topOption) return null;
    
    const topScore = result.scores.find(s => s.option.name === topOption!.option.name);
    if (!topScore) return null;
    
    const priorityScore = topScore.criteriaScores[topPriority] || 0;
    
    let analysis = `**Priority Impact:** Given your focus on ${this.formatCriterionName(topPriority)}, `;
    
    if (priorityScore >= 80) {
      analysis += `${topOption.option.name} excels in this area (${Math.round(priorityScore)}/100), `;
      analysis += `making it an excellent fit for your requirements.`;
    } else if (priorityScore >= 60) {
      analysis += `${topOption.option.name} performs well in this area (${Math.round(priorityScore)}/100), `;
      analysis += `meeting your requirements adequately.`;
    } else {
      analysis += `${topOption.option.name} has room for improvement in this area (${Math.round(priorityScore)}/100). `;
      analysis += `Consider if this trade-off is acceptable for your use case.`;
    }
    
    return analysis;
  }

  /**
   * Generate final recommendation with reasoning
   * Requirement 3.4: State a clear final recommendation based on user priorities
   * Requirement 6.1: Explain the reasoning behind the choice
   * Requirement 6.2: Describe scenarios where different options would be better
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Final recommendation with detailed reasoning
   */
  private generateRecommendation(result: EvaluationResult, constraints: UserConstraints): Recommendation {
    const topOption = result.rankings[0];
    
    if (!topOption) {
      throw new Error('Cannot generate recommendation without ranked options');
    }

    const topScore = result.scores.find(s => s.option.name === topOption!.option.name);
    if (!topScore) {
      throw new Error('Cannot find score data for top-ranked option');
    }

    // Calculate confidence based on score gap and consistency
    const confidence = this.calculateRecommendationConfidence(result, constraints);
    
    // Generate reasoning
    const reasoning = this.generateRecommendationReasoning(topScore, result, constraints);
    
    // Identify key factors
    const keyFactors = this.identifyKeyFactors(topScore, result, constraints);
    
    // Generate warnings
    const warnings = this.generateRecommendationWarnings(topScore, result, constraints);

    return {
      recommendedOption: topOption.option,
      confidence,
      reasoning,
      keyFactors,
      warnings,
    };
  }

  /**
   * Calculate confidence level for the recommendation
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Confidence level (0-1)
   */
  private calculateRecommendationConfidence(result: EvaluationResult, constraints: UserConstraints): number {
    const rankings = result.rankings;
    
    if (rankings.length < 2) {
      return 0.5; // Medium confidence with only one option
    }

    const topScore = rankings[0]!.score;
    const secondScore = rankings[1]!.score;
    const scoreGap = topScore - secondScore;

    // Base confidence on score gap
    let confidence = 0.5; // Start with medium confidence
    
    if (scoreGap > 20) {
      confidence = 0.9; // High confidence for large gaps
    } else if (scoreGap > 10) {
      confidence = 0.75; // Good confidence for moderate gaps
    } else if (scoreGap > 5) {
      confidence = 0.6; // Slightly above medium for small gaps
    } else {
      confidence = 0.4; // Lower confidence for very close scores
    }

    // Adjust based on priority alignment
    const topOption = result.scores.find(s => s.option.name === rankings[0]!.option.name);
    if (topOption) {
      const priorityAlignment = this.calculatePriorityAlignment(topOption, constraints);
      confidence = Math.min(1.0, confidence + (priorityAlignment - 0.5) * 0.2);
    }

    // Adjust based on consistency across criteria
    const consistencyBonus = this.calculateConsistencyBonus(result);
    confidence = Math.min(1.0, confidence + consistencyBonus);

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Generate detailed reasoning for the recommendation
   * @param topScore - Score for the recommended option
   * @param result - Full evaluation result
   * @param constraints - User constraints
   * @returns Detailed reasoning string
   */
  private generateRecommendationReasoning(
    topScore: OptionScore, 
    result: EvaluationResult, 
    constraints: UserConstraints
  ): string {
    const reasoningParts: string[] = [];
    
    // Start with overall performance
    reasoningParts.push(
      `${topScore.option.name} is recommended with an overall score of ${topScore.normalizedScore}/100.`
    );
    
    // Explain priority alignment
    const topPriority = this.getTopPriority(constraints.priorities);
    const priorityScore = topScore.criteriaScores[topPriority] || 0;
    
    reasoningParts.push(
      `Given your priority on ${this.formatCriterionName(topPriority)}, ` +
      `this option scores ${Math.round(priorityScore)}/100 in this area.`
    );
    
    // Highlight key strengths
    const strengths = this.identifyOptionStrengths(topScore, result);
    if (strengths.length > 0) {
      reasoningParts.push(
        `Key strengths include ${strengths.slice(0, 2).join(' and ')}.`
      );
    }
    
    // Address context-specific factors
    const contextualFactors = this.getContextualReasoningFactors(topScore.option, constraints);
    if (contextualFactors.length > 0) {
      reasoningParts.push(contextualFactors.join(' '));
    }
    
    // Compare to alternatives if close
    const secondBest = result.rankings[1];
    if (secondBest && (topScore.normalizedScore - secondBest.score) < 15) {
      reasoningParts.push(
        `While ${secondBest.option.name} is also a strong contender ` +
        `(${Math.round(secondBest.score)}/100), ${topScore.option.name} edges ahead ` +
        `due to better alignment with your specific requirements.`
      );
    }
    
    return reasoningParts.join(' ');
  }

  /**
   * Identify key factors that influenced the recommendation
   * @param topScore - Score for the recommended option
   * @param result - Full evaluation result
   * @param constraints - User constraints
   * @returns List of key factors
   */
  private identifyKeyFactors(
    topScore: OptionScore, 
    result: EvaluationResult, 
    constraints: UserConstraints
  ): string[] {
    const factors: string[] = [];
    
    // Priority-based factors
    const sortedPriorities = Object.entries(constraints.priorities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2); // Top 2 priorities
    
    for (const [priority, weight] of sortedPriorities) {
      if (weight >= 4) { // High priority
        const criterionName = this.mapPriorityToCriterion(priority);
        const score = topScore.criteriaScores[criterionName] || 0;
        factors.push(`Strong ${this.formatCriterionName(criterionName).toLowerCase()} (${Math.round(score)}/100)`);
      }
    }
    
    // Contextual factors
    if (constraints.budget === 'low') {
      factors.push('Cost-effective solution');
    }
    
    if (constraints.timeline === 'immediate') {
      factors.push('Quick implementation timeline');
    }
    
    if (constraints.team.skillLevel === 'junior') {
      factors.push('Suitable for junior team');
    }
    
    // Team experience factor
    const hasExperience = constraints.team.experience.some(exp => 
      exp.toLowerCase().includes(topScore.option.name.toLowerCase())
    );
    if (hasExperience) {
      factors.push('Team has existing experience');
    }
    
    // Scale factors
    if (constraints.scale.users > 100000) {
      factors.push('Handles high-scale requirements');
    }
    
    return factors.slice(0, 4); // Limit to top 4 factors
  }

  /**
   * Generate warnings for the recommendation
   * @param topScore - Score for the recommended option
   * @param result - Full evaluation result
   * @param constraints - User constraints
   * @returns List of warnings
   */
  private generateRecommendationWarnings(
    topScore: OptionScore, 
    result: EvaluationResult, 
    constraints: UserConstraints
  ): string[] {
    const warnings: string[] = [];
    
    // Low confidence warning
    const confidence = this.calculateRecommendationConfidence(result, constraints);
    if (confidence < 0.6) {
      warnings.push('Options are very close in scoring - consider additional evaluation criteria');
    }
    
    // Priority misalignment warnings
    const topPriority = this.getTopPriority(constraints.priorities);
    const priorityScore = topScore.criteriaScores[topPriority] || 0;
    
    if (priorityScore < 60) {
      warnings.push(
        `Recommended option scores below 60/100 in your top priority (${this.formatCriterionName(topPriority)})`
      );
    }
    
    // Context-specific warnings
    if (constraints.budget === 'low' && topScore.option.metadata.costTier === 'high') {
      warnings.push('This option may exceed your budget constraints');
    }
    
    if (constraints.timeline === 'immediate' && topScore.option.metadata.learningCurve === 'high') {
      warnings.push('Implementation may take longer than desired due to learning curve');
    }
    
    // Team experience warnings
    const hasExperience = constraints.team.experience.some(exp => 
      exp.toLowerCase().includes(topScore.option.name.toLowerCase())
    );
    if (!hasExperience && topScore.option.metadata.learningCurve === 'high') {
      warnings.push('Team lacks experience with this technology - plan for additional training time');
    }
    
    // Vendor lock-in warnings
    if (constraints.priorities.vendorLockIn >= 4 && topScore.option.metadata.vendorLockIn === 'high') {
      warnings.push('This option has high vendor lock-in risk despite your preference to avoid it');
    }
    
    return warnings;
  }

  /**
   * Generate alternative scenarios based on different priority configurations
   * Requirement 3.5: Explain "if your priority changes to X, choose Y instead"
   * Requirement 6.2: Describe scenarios where different options would be better
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns List of alternative scenarios
   */
  generateAlternativeScenarios(result: EvaluationResult, constraints: UserConstraints): AlternativeScenario[] {
    const scenarios: AlternativeScenario[] = [];
    const currentTopOption = result.rankings[0]?.option;
    
    if (!currentTopOption || result.rankings.length < 2) {
      return scenarios;
    }
    
    // Generate scenarios for different priority emphases
    const priorityScenarios = this.generatePriorityBasedScenarios(result, constraints);
    scenarios.push(...priorityScenarios);
    
    // Generate context-based scenarios
    const contextScenarios = this.generateContextBasedScenarios(result, constraints);
    scenarios.push(...contextScenarios);
    
    // Generate scale-based scenarios
    const scaleScenarios = this.generateScaleBasedScenarios(result, constraints);
    scenarios.push(...scaleScenarios);
    
    return scenarios.slice(0, 4); // Limit to top 4 scenarios
  }

  /**
   * Generate scenarios based on different priority configurations
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Priority-based alternative scenarios
   */
  private generatePriorityBasedScenarios(
    result: EvaluationResult, 
    constraints: UserConstraints
  ): AlternativeScenario[] {
    const scenarios: AlternativeScenario[] = [];
    const currentTopOption = result.rankings[0]?.option;
    
    if (!currentTopOption) {
      return scenarios;
    }
    
    // Test each priority as the dominant factor
    const priorities = ['cost', 'performance', 'easeOfUse', 'scalability', 'vendorLockIn'] as const;
    
    for (const priority of priorities) {
      // Skip if this is already the top priority
      const currentTopPriority = this.getTopPriority(constraints.priorities);
      const priorityCriterion = this.mapPriorityToCriterion(priority);
      
      if (priorityCriterion === currentTopPriority) continue;
      
      // Find the option that scores highest in this priority
      const bestForPriority = this.findBestOptionForCriterion(result, priorityCriterion);
      
      if (bestForPriority && bestForPriority.name !== currentTopOption.name) {
        const scenario = this.createPriorityScenario(priority, bestForPriority, result);
        if (scenario) {
          scenarios.push(scenario);
        }
      }
    }
    
    return scenarios;
  }

  /**
   * Generate scenarios based on different contexts
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Context-based alternative scenarios
   */
  private generateContextBasedScenarios(
    result: EvaluationResult, 
    constraints: UserConstraints
  ): AlternativeScenario[] {
    const scenarios: AlternativeScenario[] = [];
    const currentTopOption = result.rankings[0]?.option;
    
    if (!currentTopOption) {
      return scenarios;
    }
    
    // Budget scenario
    if (constraints.budget !== 'low') {
      const bestCostOption = this.findBestOptionForCriterion(result, STANDARD_CRITERIA.COST);
      if (bestCostOption && bestCostOption.name !== currentTopOption.name) {
        scenarios.push({
          scenario: 'If budget becomes a primary concern',
          recommendedOption: bestCostOption,
          reasoning: `${bestCostOption.name} offers the best cost-effectiveness, ` +
                    'making it ideal for budget-constrained projects.',
        });
      }
    }
    
    // Timeline scenario
    if (constraints.timeline !== 'immediate') {
      const bestEaseOption = this.findBestOptionForCriterion(result, STANDARD_CRITERIA.LEARNING_CURVE);
      if (bestEaseOption && bestEaseOption.name !== currentTopOption.name) {
        scenarios.push({
          scenario: 'If you need immediate deployment',
          recommendedOption: bestEaseOption,
          reasoning: `${bestEaseOption.name} has the shortest learning curve, ` +
                    'enabling faster implementation and deployment.',
        });
      }
    }
    
    // Team skill scenario
    if (constraints.team.skillLevel !== 'junior') {
      const bestPerformanceOption = this.findBestOptionForCriterion(result, STANDARD_CRITERIA.PERFORMANCE);
      if (bestPerformanceOption && bestPerformanceOption.name !== currentTopOption.name) {
        scenarios.push({
          scenario: 'If your team has strong technical expertise',
          recommendedOption: bestPerformanceOption,
          reasoning: `${bestPerformanceOption.name} offers superior performance, ` +
                    'which experienced teams can fully leverage despite complexity.',
        });
      }
    }
    
    return scenarios;
  }

  /**
   * Generate scenarios based on different scale requirements
   * @param result - Evaluation result
   * @param constraints - User constraints
   * @returns Scale-based alternative scenarios
   */
  private generateScaleBasedScenarios(
    result: EvaluationResult, 
    constraints: UserConstraints
  ): AlternativeScenario[] {
    const scenarios: AlternativeScenario[] = [];
    const currentTopOption = result.rankings[0]?.option;
    
    if (!currentTopOption) {
      return scenarios;
    }
    
    // High scale scenario
    if (constraints.scale.users <= 100000) {
      const bestScalabilityOption = this.findBestOptionForCriterion(result, STANDARD_CRITERIA.SCALABILITY);
      if (bestScalabilityOption && bestScalabilityOption.name !== currentTopOption.name) {
        scenarios.push({
          scenario: 'If you expect rapid growth to millions of users',
          recommendedOption: bestScalabilityOption,
          reasoning: `${bestScalabilityOption.name} excels at horizontal scaling, ` +
                    'making it the better choice for high-growth scenarios.',
        });
      }
    }
    
    // Enterprise scenario
    const bestEnterpriseOption = this.findBestOptionForEnterprise(result);
    if (bestEnterpriseOption && bestEnterpriseOption.name !== currentTopOption.name) {
      scenarios.push({
        scenario: 'If this becomes an enterprise-critical system',
        recommendedOption: bestEnterpriseOption,
        reasoning: `${bestEnterpriseOption.name} provides enterprise-grade features ` +
                  'and support that become crucial for mission-critical applications.',
      });
    }
    
    return scenarios;
  }

  /**
   * Helper methods for scenario generation
   */

  /**
   * Map priority key to criterion name
   * @param priority - Priority key
   * @returns Criterion name
   */
  private mapPriorityToCriterion(priority: string): string {
    const mapping: Record<string, string> = {
      cost: STANDARD_CRITERIA.COST,
      performance: STANDARD_CRITERIA.PERFORMANCE,
      easeOfUse: STANDARD_CRITERIA.LEARNING_CURVE,
      scalability: STANDARD_CRITERIA.SCALABILITY,
      vendorLockIn: STANDARD_CRITERIA.VENDOR_LOCK_IN,
    };
    return mapping[priority] || priority;
  }

  /**
   * Find the best option for a specific criterion
   * @param result - Evaluation result
   * @param criterion - Criterion to optimize for
   * @returns Best option for this criterion
   */
  private findBestOptionForCriterion(result: EvaluationResult, criterion: string): TechnicalOption | null {
    let bestOption: TechnicalOption | null = null;
    let bestScore = -1;
    
    for (const score of result.scores) {
      const criterionScore = score.criteriaScores[criterion] || 0;
      if (criterionScore > bestScore) {
        bestScore = criterionScore;
        bestOption = score.option;
      }
    }
    
    return bestOption;
  }

  /**
   * Find the best option for enterprise use
   * @param result - Evaluation result
   * @returns Best enterprise option
   */
  private findBestOptionForEnterprise(result: EvaluationResult): TechnicalOption | null {
    // Enterprise score is a composite of maintainability, vendor support, and scalability
    let bestOption: TechnicalOption | null = null;
    let bestEnterpriseScore = -1;
    
    for (const score of result.scores) {
      const maintainability = score.criteriaScores[STANDARD_CRITERIA.MAINTAINABILITY] || 0;
      const scalability = score.criteriaScores[STANDARD_CRITERIA.SCALABILITY] || 0;
      const vendorSupport = score.option.metadata.enterpriseFeatures?.length || 0;
      
      const enterpriseScore = (maintainability + scalability) / 2 + (vendorSupport * 2);
      
      if (enterpriseScore > bestEnterpriseScore) {
        bestEnterpriseScore = enterpriseScore;
        bestOption = score.option;
      }
    }
    
    return bestOption;
  }

  /**
   * Create a priority-based scenario
   * @param priority - Priority key
   * @param option - Recommended option for this priority
   * @param result - Evaluation result
   * @returns Priority-based scenario
   */
  private createPriorityScenario(
    priority: string, 
    option: TechnicalOption, 
    result: EvaluationResult
  ): AlternativeScenario | null {
    const priorityNames: Record<string, string> = {
      cost: 'cost optimization',
      performance: 'maximum performance',
      easeOfUse: 'ease of implementation',
      scalability: 'future scalability',
      vendorLockIn: 'vendor independence',
    };
    
    const priorityName = priorityNames[priority];
    if (!priorityName) return null;
    
    const optionScore = result.scores.find(s => s.option.name === option.name);
    const criterionName = this.mapPriorityToCriterion(priority);
    const score = optionScore?.criteriaScores[criterionName] || 0;
    
    return {
      scenario: `If ${priorityName} becomes your top priority`,
      recommendedOption: option,
      reasoning: `${option.name} excels in ${this.formatCriterionName(criterionName).toLowerCase()} ` +
                `(${Math.round(score)}/100), making it the optimal choice for this focus area.`,
    };
  }

  /**
   * Calculate priority alignment score
   * @param optionScore - Option score to evaluate
   * @param constraints - User constraints
   * @returns Priority alignment score (0-1)
   */
  private calculatePriorityAlignment(optionScore: OptionScore, constraints: UserConstraints): number {
    const priorities = constraints.priorities;
    const normalizedPriorities = this.normalizePriorities(priorities);
    
    let alignmentScore = 0;
    let totalWeight = 0;
    
    // Calculate weighted alignment based on how well the option performs in high-priority areas
    for (const [priority, weight] of Object.entries(normalizedPriorities)) {
      const criterion = this.mapPriorityToCriterion(priority);
      const score = optionScore.criteriaScores[criterion] || 50; // Default to middle score
      
      // Normalize score to 0-1 and weight by priority
      alignmentScore += (score / 100) * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? alignmentScore / totalWeight : 0.5;
  }

  /**
   * Calculate consistency bonus for recommendation confidence
   * @param result - Evaluation result
   * @returns Consistency bonus (0-0.2)
   */
  private calculateConsistencyBonus(result: EvaluationResult): number {
    const topOption = result.rankings[0];
    const topScore = result.scores.find(s => s.option.name === topOption!.option.name);
    
    if (!topScore) return 0;
    
    // Calculate how consistently the top option performs across criteria
    const scores = Object.values(topScore.criteriaScores);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = more consistent = higher bonus
    const consistencyBonus = Math.max(0, (20 - standardDeviation) / 100);
    
    return Math.min(0.2, consistencyBonus);
  }

  /**
   * Get contextual reasoning factors
   * @param option - Technical option
   * @param constraints - User constraints
   * @returns List of contextual reasoning factors
   */
  private getContextualReasoningFactors(option: TechnicalOption, constraints: UserConstraints): string[] {
    const factors: string[] = [];
    
    // Budget alignment
    if (constraints.budget === 'low' && option.metadata.costTier === 'low') {
      factors.push('This aligns well with your budget constraints.');
    }
    
    // Timeline alignment
    if (constraints.timeline === 'immediate' && option.metadata.learningCurve === 'low') {
      factors.push('The low learning curve supports your immediate timeline needs.');
    }
    
    // Team experience alignment
    const hasExperience = constraints.team.experience.some(exp => 
      exp.toLowerCase().includes(option.name.toLowerCase())
    );
    if (hasExperience) {
      factors.push('Your team\'s existing experience with this technology reduces implementation risk.');
    }
    
    // Scale alignment
    if (constraints.scale.users > 100000 && option.metadata.scalabilityRating >= 8) {
      factors.push('It handles your high-scale requirements effectively.');
    }
    
    return factors;
  }

  /**
   * Normalize priority weights to sum to 1
   * @param priorities - Raw priority weights
   * @returns Normalized priority weights
   */
  private normalizePriorities(priorities: UserConstraints['priorities']): UserConstraints['priorities'] {
    const total = Object.values(priorities).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
      return {
        cost: 0.2,
        performance: 0.2,
        easeOfUse: 0.2,
        scalability: 0.2,
        vendorLockIn: 0.2,
      };
    }
    
    return {
      cost: priorities.cost / total,
      performance: priorities.performance / total,
      easeOfUse: priorities.easeOfUse / total,
      scalability: priorities.scalability / total,
      vendorLockIn: priorities.vendorLockIn / total,
    };
  }

  /**
   * Capitalize words in a string
   * @param str - String to capitalize
   * @returns Capitalized string
   */
  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }
}