/**
 * Demonstration of the Constraint Collection Interface
 * Shows how to use the step-by-step constraint collection process
 */

import { ConstraintCollectionInterface, CollectionStep } from '../components/ConstraintCollectionInterface';

/**
 * Demo function showing the constraint collection workflow
 */
export function demonstrateConstraintCollection() {
  console.log('=== Technical Referee Tool - Constraint Collection Demo ===\n');

  const collector = new ConstraintCollectionInterface();
  collector.startCollection();

  console.log('1. Starting constraint collection...');
  console.log(`Current step: ${collector.getCurrentStep()}`);
  console.log(`Progress: ${Math.round(collector.getProgress() * 100)}%\n`);

  // Step 1: Collect Budget
  console.log('2. Collecting budget information...');
  const budgetResult = collector.collectBudget({ budget: 'medium' });
  console.log(`Budget collection result: ${budgetResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  if (budgetResult.warnings.length > 0) {
    console.log(`Warnings: ${budgetResult.warnings.join(', ')}`);
  }
  console.log(`Current step: ${collector.getCurrentStep()}`);
  console.log(`Progress: ${Math.round(collector.getProgress() * 100)}%\n`);

  // Step 2: Collect Scale
  console.log('3. Collecting scale information...');
  const scaleResult = collector.collectScale({ 
    users: 10000, 
    traffic: 'high' 
  });
  console.log(`Scale collection result: ${scaleResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  if (scaleResult.warnings.length > 0) {
    console.log(`Warnings: ${scaleResult.warnings.join(', ')}`);
  }
  console.log(`Current step: ${collector.getCurrentStep()}`);
  console.log(`Progress: ${Math.round(collector.getProgress() * 100)}%\n`);

  // Step 3: Collect Team
  console.log('4. Collecting team information...');
  const teamResult = collector.collectTeam({
    skillLevel: 'mixed',
    experience: ['JavaScript', 'Python', 'AWS', 'PostgreSQL']
  });
  console.log(`Team collection result: ${teamResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  if (teamResult.warnings.length > 0) {
    console.log(`Warnings: ${teamResult.warnings.join(', ')}`);
  }
  console.log(`Current step: ${collector.getCurrentStep()}`);
  console.log(`Progress: ${Math.round(collector.getProgress() * 100)}%\n`);

  // Step 4: Collect Timeline
  console.log('5. Collecting timeline information...');
  const timelineResult = collector.collectTimeline({ timeline: 'short' });
  console.log(`Timeline collection result: ${timelineResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  if (timelineResult.warnings.length > 0) {
    console.log(`Warnings: ${timelineResult.warnings.join(', ')}`);
  }
  console.log(`Current step: ${collector.getCurrentStep()}`);
  console.log(`Progress: ${Math.round(collector.getProgress() * 100)}%\n`);

  // Step 5: Collect Priorities
  console.log('6. Collecting priority information...');
  const prioritiesResult = collector.collectPriorities({
    cost: 3,
    performance: 5,
    easeOfUse: 2,
    scalability: 4,
    vendorLockIn: 3
  });
  console.log(`Priorities collection result: ${prioritiesResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  if (prioritiesResult.warnings.length > 0) {
    console.log(`Warnings: ${prioritiesResult.warnings.join(', ')}`);
  }
  console.log(`Current step: ${collector.getCurrentStep()}`);
  console.log(`Progress: ${Math.round(collector.getProgress() * 100)}%\n`);

  // Get complete constraints
  console.log('7. Getting complete constraints...');
  const completeConstraints = collector.getCompleteConstraints();
  if (completeConstraints) {
    console.log('Complete constraints collected successfully:');
    console.log(JSON.stringify(completeConstraints, null, 2));
  } else {
    console.log('Failed to get complete constraints');
  }

  // Demonstrate validation
  console.log('\n8. Validating complete constraints...');
  const validation = collector.validateComplete();
  console.log(`Validation result: ${validation.isValid ? 'VALID' : 'INVALID'}`);
  if (validation.errors.length > 0) {
    console.log('Errors:', validation.errors.map(e => e.message).join(', '));
  }
  if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings.join(', '));
  }

  // Demonstrate form options
  console.log('\n9. Available form options:');
  const formOptions = collector.getFormOptions();
  console.log('Budget options:', formOptions.budget);
  console.log('Traffic options:', formOptions.traffic);
  console.log('Skill level options:', formOptions.skillLevel);
  console.log('Timeline options:', formOptions.timeline);
  console.log('Priority range:', formOptions.priorityRange);

  // Demonstrate priority helpers
  console.log('\n10. Priority ranking helpers:');
  const helpers = collector.getPriorityRankingHelpers();
  console.log('Priority label for 5:', helpers.getPriorityLabel(5));
  console.log('Priority descriptions:', helpers.getPriorityDescriptions());
  
  const priorityAnalysis = helpers.analyzePriorityBalance({
    cost: 3,
    performance: 5,
    easeOfUse: 2,
    scalability: 4,
    vendorLockIn: 3
  });
  console.log('Priority balance analysis:', priorityAnalysis);

  console.log('\n=== Demo Complete ===');
}

/**
 * Demo function showing error handling
 */
export function demonstrateErrorHandling() {
  console.log('\n=== Error Handling Demo ===\n');

  const collector = new ConstraintCollectionInterface();
  collector.startCollection();

  // Test invalid budget
  console.log('1. Testing invalid budget...');
  const invalidBudgetResult = collector.collectBudget({ budget: 'invalid' as any });
  console.log(`Result: ${invalidBudgetResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  console.log('Errors:', invalidBudgetResult.errors.map(e => e.message));

  // Test invalid scale
  console.log('\n2. Testing invalid scale...');
  const invalidScaleResult = collector.collectScale({ 
    users: -100, 
    traffic: 'invalid' as any 
  });
  console.log(`Result: ${invalidScaleResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  console.log('Errors:', invalidScaleResult.errors.map(e => e.message));

  // Test invalid priorities
  console.log('\n3. Testing invalid priorities...');
  const invalidPrioritiesResult = collector.collectPriorities({
    cost: 10,  // Out of range
    performance: 0,  // Out of range
    easeOfUse: 3,
    scalability: 3,
    vendorLockIn: 3
  });
  console.log(`Result: ${invalidPrioritiesResult.isValid ? 'SUCCESS' : 'FAILED'}`);
  console.log('Errors:', invalidPrioritiesResult.errors.map(e => e.message));

  console.log('\n=== Error Handling Demo Complete ===');
}

// Run demos if this file is executed directly
if (require.main === module) {
  demonstrateConstraintCollection();
  demonstrateErrorHandling();
}