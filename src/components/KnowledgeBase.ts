/**
 * Knowledge Base implementation
 * Provides domain-specific evaluation criteria and scoring logic for different technology categories
 */

import { 
  DomainKnowledge, 
  EvaluationCriteria, 
  ScoringRule, 
  CloudProviderData, 
  BackendFrameworkData, 
  DatabaseData,
  STANDARD_CRITERIA,
  StandardCriterion 
} from '../types/knowledge';
import { TechnicalOption } from '../types/core';
import { KnowledgeBase as IKnowledgeBase } from '../types/interfaces';

/**
 * Implementation of the Knowledge Base interface
 * Contains domain-specific evaluation logic for cloud providers, backend frameworks, and databases
 */
export class KnowledgeBase implements IKnowledgeBase {
  private domainKnowledge: Map<string, DomainKnowledge> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize the knowledge base with domain-specific data
   */
  private initializeKnowledgeBase(): void {
    this.domainKnowledge.set('cloud', this.createCloudProviderKnowledge());
    this.domainKnowledge.set('backend', this.createBackendFrameworkKnowledge());
    this.domainKnowledge.set('database', this.createDatabaseKnowledge());
  }

  /**
   * Get evaluation criteria for a specific technology category
   */
  getCriteriaForCategory(category: TechnicalOption['category']): EvaluationCriteria[] {
    const knowledge = this.domainKnowledge.get(category);
    if (!knowledge) {
      return this.getGenericCriteria();
    }
    return knowledge.criteria;
  }

  /**
   * Get scoring rules for a specific technology category
   */
  getScoringRulesForCategory(category: TechnicalOption['category']): ScoringRule[] {
    const knowledge = this.domainKnowledge.get(category);
    if (!knowledge) {
      return [];
    }
    return knowledge.scoringRules;
  }

  /**
   * Check if a technology is known in the knowledge base
   */
  isKnownTechnology(option: TechnicalOption): boolean {
    const knowledge = this.domainKnowledge.get(option.category);
    if (!knowledge) {
      return false;
    }

    // Check if we have specific data for this technology
    return this.hasSpecificTechnologyData(option);
  }

  /**
   * Check if we have specific data for a technology option
   */
  private hasSpecificTechnologyData(option: TechnicalOption): boolean {
    const knownTechnologies = this.getKnownTechnologiesForCategory(option.category);
    return knownTechnologies.includes(option.name.toLowerCase());
  }

  /**
   * Get list of known technologies for a category
   */
  private getKnownTechnologiesForCategory(category: string): string[] {
    switch (category) {
      case 'cloud':
        return ['aws', 'gcp', 'azure', 'digitalocean', 'linode', 'vultr'];
      case 'backend':
        return ['node.js', 'django', 'spring boot', 'express', 'fastapi', 'rails', 'laravel'];
      case 'database':
        return ['postgresql', 'mysql', 'mongodb', 'redis', 'cassandra', 'dynamodb'];
      default:
        return [];
    }
  }

  /**
   * Create cloud provider domain knowledge
   */
  private createCloudProviderKnowledge(): DomainKnowledge {
    const criteria: EvaluationCriteria[] = [
      {
        name: STANDARD_CRITERIA.COST,
        weight: 1.0,
        description: 'Pricing models, operational costs, and resource efficiency',
        scoringFunction: (option: TechnicalOption) => this.scoreCloudCost(option)
      },
      {
        name: STANDARD_CRITERIA.PERFORMANCE,
        weight: 1.0,
        description: 'Compute performance, network speed, and global infrastructure',
        scoringFunction: (option: TechnicalOption) => this.scoreCloudPerformance(option)
      },
      {
        name: STANDARD_CRITERIA.SCALABILITY,
        weight: 1.0,
        description: 'Auto-scaling capabilities and global reach',
        scoringFunction: (option: TechnicalOption) => this.scoreCloudScalability(option)
      },
      {
        name: STANDARD_CRITERIA.LEARNING_CURVE,
        weight: 1.0,
        description: 'Ease of getting started and documentation quality',
        scoringFunction: (option: TechnicalOption) => this.scoreCloudLearningCurve(option)
      },
      {
        name: STANDARD_CRITERIA.VENDOR_LOCK_IN,
        weight: 1.0,
        description: 'Portability and standards compliance',
        scoringFunction: (option: TechnicalOption) => this.scoreCloudVendorLockIn(option)
      },
      {
        name: STANDARD_CRITERIA.MAINTAINABILITY,
        weight: 1.0,
        description: 'Service reliability and enterprise support',
        scoringFunction: (option: TechnicalOption) => this.scoreCloudMaintainability(option)
      }
    ];

    const scoringRules: ScoringRule[] = [
      {
        name: 'Enterprise Features Bonus',
        condition: (option) => this.hasEnterpriseFeatures(option),
        scoreAdjustment: 10,
        affectedCriteria: [STANDARD_CRITERIA.MAINTAINABILITY]
      },
      {
        name: 'High Market Share Bonus',
        condition: (option) => this.hasHighMarketShare(option),
        scoreAdjustment: 5,
        affectedCriteria: [STANDARD_CRITERIA.LEARNING_CURVE, STANDARD_CRITERIA.MAINTAINABILITY]
      },
      {
        name: 'Pay-as-you-go Cost Advantage',
        condition: (option) => this.hasPayAsYouGoPricing(option),
        scoreAdjustment: 8,
        affectedCriteria: [STANDARD_CRITERIA.COST]
      }
    ];

    return {
      category: 'cloud',
      criteria,
      scoringRules
    };
  }
  /**
   * Create backend framework domain knowledge
   */
  private createBackendFrameworkKnowledge(): DomainKnowledge {
    const criteria: EvaluationCriteria[] = [
      {
        name: STANDARD_CRITERIA.COST,
        weight: 1.0,
        description: 'Development costs, hosting requirements, and licensing',
        scoringFunction: (option: TechnicalOption) => this.scoreBackendCost(option)
      },
      {
        name: STANDARD_CRITERIA.PERFORMANCE,
        weight: 1.0,
        description: 'Runtime performance and throughput capabilities',
        scoringFunction: (option: TechnicalOption) => this.scoreBackendPerformance(option)
      },
      {
        name: STANDARD_CRITERIA.SCALABILITY,
        weight: 1.0,
        description: 'Horizontal scaling and load handling capabilities',
        scoringFunction: (option: TechnicalOption) => this.scoreBackendScalability(option)
      },
      {
        name: STANDARD_CRITERIA.LEARNING_CURVE,
        weight: 1.0,
        description: 'Development speed and ease of learning',
        scoringFunction: (option: TechnicalOption) => this.scoreBackendLearningCurve(option)
      },
      {
        name: STANDARD_CRITERIA.VENDOR_LOCK_IN,
        weight: 1.0,
        description: 'Framework independence and portability',
        scoringFunction: (option: TechnicalOption) => this.scoreBackendVendorLockIn(option)
      },
      {
        name: STANDARD_CRITERIA.MAINTAINABILITY,
        weight: 1.0,
        description: 'Code structure, testing support, and community',
        scoringFunction: (option: TechnicalOption) => this.scoreBackendMaintainability(option)
      }
    ];

    const scoringRules: ScoringRule[] = [
      {
        name: 'High Development Speed Bonus',
        condition: (option) => this.hasHighDevelopmentSpeed(option),
        scoreAdjustment: 10,
        affectedCriteria: [STANDARD_CRITERIA.LEARNING_CURVE]
      },
      {
        name: 'Large Community Bonus',
        condition: (option) => this.hasLargeCommunity(option),
        scoreAdjustment: 8,
        affectedCriteria: [STANDARD_CRITERIA.MAINTAINABILITY, STANDARD_CRITERIA.LEARNING_CURVE]
      },
      {
        name: 'Enterprise Adoption Bonus',
        condition: (option) => this.hasEnterpriseAdoption(option),
        scoreAdjustment: 6,
        affectedCriteria: [STANDARD_CRITERIA.MAINTAINABILITY]
      }
    ];

    return {
      category: 'backend',
      criteria,
      scoringRules
    };
  }

  /**
   * Create database domain knowledge
   */
  private createDatabaseKnowledge(): DomainKnowledge {
    const criteria: EvaluationCriteria[] = [
      {
        name: STANDARD_CRITERIA.COST,
        weight: 1.0,
        description: 'Licensing costs, hosting requirements, and operational expenses',
        scoringFunction: (option: TechnicalOption) => this.scoreDatabaseCost(option)
      },
      {
        name: STANDARD_CRITERIA.PERFORMANCE,
        weight: 1.0,
        description: 'Query performance and throughput capabilities',
        scoringFunction: (option: TechnicalOption) => this.scoreDatabasePerformance(option)
      },
      {
        name: STANDARD_CRITERIA.SCALABILITY,
        weight: 1.0,
        description: 'Horizontal scaling and data distribution capabilities',
        scoringFunction: (option: TechnicalOption) => this.scoreDatabaseScalability(option)
      },
      {
        name: STANDARD_CRITERIA.LEARNING_CURVE,
        weight: 1.0,
        description: 'Query language complexity and ease of use',
        scoringFunction: (option: TechnicalOption) => this.scoreDatabaseLearningCurve(option)
      },
      {
        name: STANDARD_CRITERIA.VENDOR_LOCK_IN,
        weight: 1.0,
        description: 'Standards compliance and data portability',
        scoringFunction: (option: TechnicalOption) => this.scoreDatabaseVendorLockIn(option)
      },
      {
        name: STANDARD_CRITERIA.MAINTAINABILITY,
        weight: 1.0,
        description: 'ACID compliance, backup capabilities, and tooling',
        scoringFunction: (option: TechnicalOption) => this.scoreDatabaseMaintainability(option)
      }
    ];

    const scoringRules: ScoringRule[] = [
      {
        name: 'ACID Compliance Bonus',
        condition: (option) => this.hasACIDCompliance(option),
        scoreAdjustment: 10,
        affectedCriteria: [STANDARD_CRITERIA.MAINTAINABILITY]
      },
      {
        name: 'Schema Flexibility Bonus',
        condition: (option) => this.hasSchemaFlexibility(option),
        scoreAdjustment: 8,
        affectedCriteria: [STANDARD_CRITERIA.SCALABILITY]
      },
      {
        name: 'Strong Consistency Bonus',
        condition: (option) => this.hasStrongConsistency(option),
        scoreAdjustment: 6,
        affectedCriteria: [STANDARD_CRITERIA.MAINTAINABILITY]
      }
    ];

    return {
      category: 'database',
      criteria,
      scoringRules
    };
  }

  /**
   * Get generic criteria for unknown categories
   */
  private getGenericCriteria(): EvaluationCriteria[] {
    return [
      {
        name: STANDARD_CRITERIA.COST,
        weight: 1.0,
        description: 'Overall cost considerations',
        scoringFunction: () => 50 // Default neutral score
      },
      {
        name: STANDARD_CRITERIA.PERFORMANCE,
        weight: 1.0,
        description: 'Performance characteristics',
        scoringFunction: () => 50
      },
      {
        name: STANDARD_CRITERIA.SCALABILITY,
        weight: 1.0,
        description: 'Scaling capabilities',
        scoringFunction: () => 50
      },
      {
        name: STANDARD_CRITERIA.LEARNING_CURVE,
        weight: 1.0,
        description: 'Ease of adoption',
        scoringFunction: () => 50
      },
      {
        name: STANDARD_CRITERIA.VENDOR_LOCK_IN,
        weight: 1.0,
        description: 'Vendor independence',
        scoringFunction: () => 50
      },
      {
        name: STANDARD_CRITERIA.MAINTAINABILITY,
        weight: 1.0,
        description: 'Long-term maintainability',
        scoringFunction: () => 50
      }
    ];
  }
  // Cloud Provider Scoring Functions
  private scoreCloudCost(option: TechnicalOption): number {
    const data = option.metadata as CloudProviderData;
    if (!data) return 50;

    let score = 50;
    
    // Pay-as-you-go is generally more cost-effective for startups
    if (data.pricingModel === 'pay-as-you-go') score += 15;
    else if (data.pricingModel === 'hybrid') score += 10;
    else if (data.pricingModel === 'reserved') score += 5; // reserved instances

    // Market leaders often have competitive pricing
    if (data.marketShare && data.marketShare > 30) score += 10;
    else if (data.marketShare && data.marketShare > 15) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private scoreCloudPerformance(option: TechnicalOption): number {
    const data = option.metadata as CloudProviderData;
    if (!data) return 50;

    let score = 50;

    // More regions generally mean better performance
    if (data.regions && data.regions > 20) score += 20;
    else if (data.regions && data.regions > 10) score += 15;
    else if (data.regions && data.regions > 5) score += 10;

    // Market leaders typically have better infrastructure
    if (data.marketShare && data.marketShare > 30) score += 15;
    else if (data.marketShare && data.marketShare > 15) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreCloudScalability(option: TechnicalOption): number {
    const data = option.metadata as CloudProviderData;
    if (!data) return 50;

    let score = 50;

    // More services mean better scaling options
    if (data.serviceCount && data.serviceCount > 200) score += 20;
    else if (data.serviceCount && data.serviceCount > 100) score += 15;
    else if (data.serviceCount && data.serviceCount > 50) score += 10;

    // Global presence improves scalability
    if (data.regions && data.regions > 15) score += 15;
    else if (data.regions && data.regions > 8) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreCloudLearningCurve(option: TechnicalOption): number {
    const data = option.metadata as CloudProviderData;
    if (!data) return 50;

    let score = 50;

    // Lower learning curve is better (inverse scoring)
    if (data.learningCurve === 'low') score += 20;
    else if (data.learningCurve === 'medium') score += 10;
    // high learning curve gets no bonus

    // Market leaders have better documentation and community
    if (data.marketShare && data.marketShare > 30) score += 15;
    else if (data.marketShare && data.marketShare > 15) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreCloudVendorLockIn(option: TechnicalOption): number {
    const data = option.metadata as CloudProviderData;
    if (!data) return 50;

    let score = 50;

    // Fewer proprietary services mean less lock-in
    if (data.serviceCount && data.serviceCount < 50) score += 20;
    else if (data.serviceCount && data.serviceCount < 100) score += 10;
    // More services typically mean more proprietary offerings

    // Smaller providers often have less lock-in
    if (data.marketShare && data.marketShare < 10) score += 15;
    else if (data.marketShare && data.marketShare < 25) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreCloudMaintainability(option: TechnicalOption): number {
    const data = option.metadata as CloudProviderData;
    if (!data) return 50;

    let score = 50;

    // Enterprise features improve maintainability
    const enterpriseFeatures = data.enterpriseFeatures || [];
    score += Math.min(20, enterpriseFeatures.length * 2);

    // Compliance certifications help with maintainability
    const certifications = data.certifications || [];
    score += Math.min(15, certifications.length * 3);

    // Market leaders typically have better support
    if (data.marketShare && data.marketShare > 30) score += 10;
    else if (data.marketShare && data.marketShare > 15) score += 5;

    return Math.min(100, Math.max(0, score));
  }
  // Backend Framework Scoring Functions
  private scoreBackendCost(option: TechnicalOption): number {
    const data = option.metadata as BackendFrameworkData;
    if (!data) return 50;

    let score = 50;

    // Open source frameworks are generally more cost-effective
    // Assume all frameworks in our knowledge base are open source
    score += 15;

    // Languages with lower hosting requirements
    if (data.language === 'javascript' || data.language === 'python') score += 10;
    else if (data.language === 'java' || data.language === 'c#') score += 5;

    // High development speed reduces development costs
    if (data.developmentSpeed && data.developmentSpeed >= 8) score += 15;
    else if (data.developmentSpeed && data.developmentSpeed >= 6) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreBackendPerformance(option: TechnicalOption): number {
    const data = option.metadata as BackendFrameworkData;
    if (!data) return 50;

    let score = 30; // Base score
    
    // Direct performance rating mapping
    if (data.performanceRating) {
      score += data.performanceRating * 7; // Scale 1-10 to contribute up to 70 points
    }

    return Math.min(100, Math.max(0, score));
  }

  private scoreBackendScalability(option: TechnicalOption): number {
    const data = option.metadata as BackendFrameworkData;
    if (!data) return 50;

    let score = 50;

    // Performance rating correlates with scalability
    if (data.performanceRating && data.performanceRating >= 8) score += 20;
    else if (data.performanceRating && data.performanceRating >= 6) score += 15;
    else if (data.performanceRating && data.performanceRating >= 4) score += 10;

    // Enterprise adoption suggests good scalability
    if (data.enterpriseAdoption && data.enterpriseAdoption >= 8) score += 15;
    else if (data.enterpriseAdoption && data.enterpriseAdoption >= 6) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreBackendLearningCurve(option: TechnicalOption): number {
    const data = option.metadata as BackendFrameworkData;
    if (!data) return 50;

    let score = 30;

    // Development speed indicates ease of use
    if (data.developmentSpeed) {
      score += data.developmentSpeed * 5; // Scale 1-10 to contribute up to 50 points
    }

    // Learning curve (inverse scoring - lower is better)
    if (data.learningCurve === 'low') score += 20;
    else if (data.learningCurve === 'medium') score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreBackendVendorLockIn(option: TechnicalOption): number {
    const data = option.metadata as BackendFrameworkData;
    if (!data) return 50;

    let score = 70; // Most backend frameworks have low vendor lock-in

    // Popular languages have better portability
    if (data.language === 'javascript' || data.language === 'python' || data.language === 'java') {
      score += 15;
    }

    // Large package ecosystem suggests good portability
    if (data.packageEcosystem && data.packageEcosystem > 100000) score += 15;
    else if (data.packageEcosystem && data.packageEcosystem > 50000) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreBackendMaintainability(option: TechnicalOption): number {
    const data = option.metadata as BackendFrameworkData;
    if (!data) return 50;

    let score = 30;

    // Community size helps with maintainability
    if (data.communitySize && data.communitySize > 100000) score += 25;
    else if (data.communitySize && data.communitySize > 50000) score += 20;
    else if (data.communitySize && data.communitySize > 10000) score += 15;

    // Enterprise adoption suggests good maintainability
    if (data.enterpriseAdoption && data.enterpriseAdoption >= 8) score += 20;
    else if (data.enterpriseAdoption && data.enterpriseAdoption >= 6) score += 15;
    else if (data.enterpriseAdoption && data.enterpriseAdoption >= 4) score += 10;

    // Package ecosystem helps with maintainability
    if (data.packageEcosystem && data.packageEcosystem > 100000) score += 15;
    else if (data.packageEcosystem && data.packageEcosystem > 50000) score += 10;

    return Math.min(100, Math.max(0, score));
  }
  // Database Scoring Functions
  private scoreDatabaseCost(option: TechnicalOption): number {
    const data = option.metadata as DatabaseData;
    if (!data) return 50;

    let score = 50;

    // Open source databases are generally more cost-effective
    // PostgreSQL, MySQL, MongoDB are open source
    const openSourceDatabases = ['postgresql', 'mysql', 'mongodb', 'redis', 'cassandra'];
    if (openSourceDatabases.includes(option.name.toLowerCase())) {
      score += 20;
    }

    // Simpler databases have lower operational costs
    if (data.queryComplexity === 'simple') score += 15;
    else if (data.queryComplexity === 'moderate') score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreDatabasePerformance(option: TechnicalOption): number {
    const data = option.metadata as DatabaseData;
    if (!data) return 50;

    let score = 30; // Base score
    
    // Direct performance rating mapping
    if (data.performanceRating) {
      score += data.performanceRating * 7; // Scale 1-10 to contribute up to 70 points
    }

    return Math.min(100, Math.max(0, score));
  }

  private scoreDatabaseScalability(option: TechnicalOption): number {
    const data = option.metadata as DatabaseData;
    if (!data) return 50;

    let score = 50;

    // Horizontal scaling capability
    if (data.horizontalScaling === 'excellent') score += 25;
    else if (data.horizontalScaling === 'good') score += 15;
    else if (data.horizontalScaling === 'poor') score -= 10;

    // Schema flexibility helps with scaling
    if (data.schemaFlexibility === 'schemaless') score += 15;
    else if (data.schemaFlexibility === 'flexible') score += 10;

    // NoSQL databases often scale better
    if (data.type !== 'relational') score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreDatabaseLearningCurve(option: TechnicalOption): number {
    const data = option.metadata as DatabaseData;
    if (!data) return 50;

    let score = 50;

    // Query complexity (inverse scoring - simpler is better)
    if (data.queryComplexity === 'simple') score += 20;
    else if (data.queryComplexity === 'moderate') score += 10;
    // complex gets no bonus

    // SQL databases are generally more familiar
    if (data.type === 'relational') score += 15;

    // Rigid schema is more familiar to most developers
    if (data.schemaFlexibility === 'rigid') score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private scoreDatabaseVendorLockIn(option: TechnicalOption): number {
    const data = option.metadata as DatabaseData;
    if (!data) return 50;

    let score = 50;

    // SQL databases have better portability
    if (data.type === 'relational') score += 20;

    // Open source databases have less lock-in
    const openSourceDatabases = ['postgresql', 'mysql', 'mongodb', 'redis', 'cassandra'];
    if (openSourceDatabases.includes(option.name.toLowerCase())) {
      score += 25;
    }

    // Standard query languages reduce lock-in
    if (data.type === 'relational') score += 10; // SQL is standard

    return Math.min(100, Math.max(0, score));
  }

  private scoreDatabaseMaintainability(option: TechnicalOption): number {
    const data = option.metadata as DatabaseData;
    if (!data) return 50;

    let score = 50;

    // ACID compliance improves maintainability
    if (data.acidCompliance) score += 20;

    // Strong consistency is easier to reason about
    if (data.consistencyModel === 'strong') score += 15;
    else if (data.consistencyModel === 'configurable') score += 10;

    // Mature relational databases are well-understood
    if (data.type === 'relational') score += 10;

    return Math.min(100, Math.max(0, score));
  }
  // Helper functions for scoring rules
  private hasEnterpriseFeatures(option: TechnicalOption): boolean {
    const data = option.metadata as CloudProviderData;
    return data && data.enterpriseFeatures && data.enterpriseFeatures.length > 5;
  }

  private hasHighMarketShare(option: TechnicalOption): boolean {
    const data = option.metadata as CloudProviderData;
    return data && data.marketShare > 25;
  }

  private hasPayAsYouGoPricing(option: TechnicalOption): boolean {
    const data = option.metadata as CloudProviderData;
    return data && data.pricingModel === 'pay-as-you-go';
  }

  private hasHighDevelopmentSpeed(option: TechnicalOption): boolean {
    const data = option.metadata as BackendFrameworkData;
    return data && data.developmentSpeed >= 8;
  }

  private hasLargeCommunity(option: TechnicalOption): boolean {
    const data = option.metadata as BackendFrameworkData;
    return data && data.communitySize > 50000;
  }

  private hasEnterpriseAdoption(option: TechnicalOption): boolean {
    const data = option.metadata as BackendFrameworkData;
    return data && data.enterpriseAdoption >= 7;
  }

  private hasACIDCompliance(option: TechnicalOption): boolean {
    const data = option.metadata as DatabaseData;
    return data && data.acidCompliance === true;
  }

  private hasSchemaFlexibility(option: TechnicalOption): boolean {
    const data = option.metadata as DatabaseData;
    return data && (data.schemaFlexibility === 'flexible' || data.schemaFlexibility === 'schemaless');
  }

  private hasStrongConsistency(option: TechnicalOption): boolean {
    const data = option.metadata as DatabaseData;
    return data && data.consistencyModel === 'strong';
  }

  /**
   * Get domain knowledge for a specific category
   */
  getDomainKnowledge(category: string): DomainKnowledge | null {
    return this.domainKnowledge.get(category) || null;
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): string[] {
    return Array.from(this.domainKnowledge.keys());
  }

  /**
   * Get technology-specific metadata with fallback to defaults
   */
  getTechnologyMetadata(option: TechnicalOption): Record<string, any> {
    if (this.isKnownTechnology(option)) {
      return option.metadata;
    }

    // Return fallback metadata for unknown technologies
    return this.getFallbackMetadata(option.category);
  }

  /**
   * Get fallback metadata for unknown technologies
   */
  private getFallbackMetadata(category: string): Record<string, any> {
    switch (category) {
      case 'cloud':
        return {
          name: 'Unknown Cloud Provider',
          pricingModel: 'pay-as-you-go',
          serviceCount: 50,
          enterpriseFeatures: [],
          learningCurve: 'medium',
          marketShare: 5,
          regions: 5,
          certifications: []
        };

      case 'backend':
        return {
          name: 'Unknown Backend Framework',
          language: 'unknown',
          developmentSpeed: 5,
          communitySize: 10000,
          enterpriseAdoption: 5,
          performanceRating: 5,
          learningCurve: 'medium',
          packageEcosystem: 10000
        };

      case 'database':
        return {
          name: 'Unknown Database',
          type: 'relational',
          schemaFlexibility: 'rigid',
          queryComplexity: 'moderate',
          horizontalScaling: 'good',
          consistencyModel: 'strong',
          acidCompliance: true,
          performanceRating: 5
        };

      default:
        return {};
    }
  }

  /**
   * Evaluate a technology option against all criteria for its category
   */
  evaluateOption(option: TechnicalOption): Record<string, number> {
    const criteria = this.getCriteriaForCategory(option.category);
    const scores: Record<string, number> = {};

    for (const criterion of criteria) {
      try {
        scores[criterion.name] = criterion.scoringFunction(option);
      } catch (error) {
        // Fallback to neutral score if scoring function fails
        console.warn(`Scoring function failed for ${option.name} on ${criterion.name}:`, error);
        scores[criterion.name] = 50;
      }
    }

    return scores;
  }

  /**
   * Apply scoring rules to adjust base scores
   */
  applyScoreAdjustments(option: TechnicalOption, baseScores: Record<string, number>): Record<string, number> {
    const scoringRules = this.getScoringRulesForCategory(option.category);
    const adjustedScores = { ...baseScores };

    for (const rule of scoringRules) {
      try {
        if (rule.condition(option)) {
          for (const criterionName of rule.affectedCriteria) {
            if (adjustedScores[criterionName] !== undefined) {
              adjustedScores[criterionName] = Math.min(100, Math.max(0, 
                adjustedScores[criterionName] + rule.scoreAdjustment
              ));
            }
          }
        }
      } catch (error) {
        console.warn(`Scoring rule failed for ${option.name} with rule ${rule.name}:`, error);
      }
    }

    return adjustedScores;
  }

  /**
   * Get comprehensive evaluation for an option including rule adjustments
   */
  getComprehensiveEvaluation(option: TechnicalOption): Record<string, number> {
    const baseScores = this.evaluateOption(option);
    return this.applyScoreAdjustments(option, baseScores);
  }

  /**
   * Validate that an option has the required metadata structure for its category
   */
  validateOptionMetadata(option: TechnicalOption): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!option.metadata) {
      errors.push('Option metadata is missing');
      return { isValid: false, errors };
    }

    switch (option.category) {
      case 'cloud':
        this.validateCloudProviderMetadata(option.metadata, errors);
        break;
      case 'backend':
        this.validateBackendFrameworkMetadata(option.metadata, errors);
        break;
      case 'database':
        this.validateDatabaseMetadata(option.metadata, errors);
        break;
      default:
        // Unknown categories are valid but will use fallback logic
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateCloudProviderMetadata(metadata: any, errors: string[]): void {
    const required = ['pricingModel', 'serviceCount', 'learningCurve', 'marketShare', 'regions'];
    for (const field of required) {
      if (metadata[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (metadata.pricingModel && !['pay-as-you-go', 'reserved', 'hybrid'].includes(metadata.pricingModel)) {
      errors.push('Invalid pricing model');
    }

    if (metadata.learningCurve && !['low', 'medium', 'high'].includes(metadata.learningCurve)) {
      errors.push('Invalid learning curve value');
    }
  }

  private validateBackendFrameworkMetadata(metadata: any, errors: string[]): void {
    const required = ['language', 'developmentSpeed', 'communitySize', 'enterpriseAdoption', 'performanceRating'];
    for (const field of required) {
      if (metadata[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    const numericFields = ['developmentSpeed', 'communitySize', 'enterpriseAdoption', 'performanceRating'];
    for (const field of numericFields) {
      if (metadata[field] !== undefined && typeof metadata[field] !== 'number') {
        errors.push(`Field ${field} must be numeric`);
      }
    }
  }

  private validateDatabaseMetadata(metadata: any, errors: string[]): void {
    const required = ['type', 'schemaFlexibility', 'queryComplexity', 'horizontalScaling', 'consistencyModel', 'performanceRating'];
    for (const field of required) {
      if (metadata[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (metadata.type && !['relational', 'document', 'key-value', 'graph', 'columnar'].includes(metadata.type)) {
      errors.push('Invalid database type');
    }

    if (metadata.schemaFlexibility && !['rigid', 'flexible', 'schemaless'].includes(metadata.schemaFlexibility)) {
      errors.push('Invalid schema flexibility value');
    }
  }

  /**
   * Get sample technology data for testing and demonstration
   */
  getSampleTechnologies(): { [category: string]: TechnicalOption[] } {
    return {
      cloud: [
        {
          name: 'AWS',
          category: 'cloud',
          metadata: {
            pricingModel: 'pay-as-you-go',
            serviceCount: 200,
            enterpriseFeatures: ['IAM', 'CloudTrail', 'Config', 'Organizations', 'Control Tower', 'Security Hub'],
            learningCurve: 'high',
            marketShare: 32,
            regions: 25,
            certifications: ['SOC', 'ISO', 'HIPAA', 'PCI DSS']
          } as CloudProviderData
        },
        {
          name: 'GCP',
          category: 'cloud',
          metadata: {
            pricingModel: 'pay-as-you-go',
            serviceCount: 100,
            enterpriseFeatures: ['IAM', 'Cloud Audit Logs', 'Resource Manager', 'Security Command Center'],
            learningCurve: 'medium',
            marketShare: 9,
            regions: 24,
            certifications: ['SOC', 'ISO', 'HIPAA']
          } as CloudProviderData
        },
        {
          name: 'Azure',
          category: 'cloud',
          metadata: {
            pricingModel: 'hybrid',
            serviceCount: 150,
            enterpriseFeatures: ['Active Directory', 'Azure Policy', 'Security Center', 'Sentinel'],
            learningCurve: 'medium',
            marketShare: 20,
            regions: 22,
            certifications: ['SOC', 'ISO', 'HIPAA', 'FedRAMP']
          } as CloudProviderData
        }
      ],
      backend: [
        {
          name: 'Node.js',
          category: 'backend',
          metadata: {
            language: 'javascript',
            developmentSpeed: 8,
            communitySize: 150000,
            enterpriseAdoption: 7,
            performanceRating: 7,
            learningCurve: 'low',
            packageEcosystem: 1300000
          } as BackendFrameworkData
        },
        {
          name: 'Django',
          category: 'backend',
          metadata: {
            language: 'python',
            developmentSpeed: 9,
            communitySize: 80000,
            enterpriseAdoption: 8,
            performanceRating: 6,
            learningCurve: 'low',
            packageEcosystem: 300000
          } as BackendFrameworkData
        },
        {
          name: 'Spring Boot',
          category: 'backend',
          metadata: {
            language: 'java',
            developmentSpeed: 6,
            communitySize: 60000,
            enterpriseAdoption: 9,
            performanceRating: 8,
            learningCurve: 'medium',
            packageEcosystem: 400000
          } as BackendFrameworkData
        }
      ],
      database: [
        {
          name: 'PostgreSQL',
          category: 'database',
          metadata: {
            type: 'relational',
            schemaFlexibility: 'rigid',
            queryComplexity: 'moderate',
            horizontalScaling: 'good',
            consistencyModel: 'strong',
            acidCompliance: true,
            performanceRating: 8
          } as DatabaseData
        },
        {
          name: 'MongoDB',
          category: 'database',
          metadata: {
            type: 'document',
            schemaFlexibility: 'schemaless',
            queryComplexity: 'simple',
            horizontalScaling: 'excellent',
            consistencyModel: 'configurable',
            acidCompliance: false,
            performanceRating: 7
          } as DatabaseData
        },
        {
          name: 'MySQL',
          category: 'database',
          metadata: {
            type: 'relational',
            schemaFlexibility: 'rigid',
            queryComplexity: 'simple',
            horizontalScaling: 'poor',
            consistencyModel: 'strong',
            acidCompliance: true,
            performanceRating: 7
          } as DatabaseData
        }
      ]
    };
  }
}