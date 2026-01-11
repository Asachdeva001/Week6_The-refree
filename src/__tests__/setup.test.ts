/**
 * Basic setup test to verify project configuration
 * Feature: technical-referee, Setup validation
 */

import TechnicalReferee from '../index';
import { UserConstraints, TechnicalOption } from '../types';

describe('Project Setup', () => {
  let referee: TechnicalReferee;

  beforeEach(() => {
    referee = new TechnicalReferee();
  });

  test('should create TechnicalReferee instance', () => {
    expect(referee).toBeInstanceOf(TechnicalReferee);
  });

  test('should have correct default configuration', () => {
    const config = referee.getConfig();
    
    expect(config.minOptions).toBe(2);
    expect(config.maxOptions).toBe(3);
    expect(config.confidenceThreshold).toBe(0.7);
    expect(config.defaultPriorities).toEqual({
      cost: 3,
      performance: 3,
      easeOfUse: 3,
      scalability: 3,
      vendorLockIn: 3,
    });
  });

  test('should validate option count constraints', async () => {
    const constraints: UserConstraints = {
      budget: 'medium',
      scale: { users: 1000, traffic: 'medium' },
      team: { skillLevel: 'mixed', experience: ['javascript'] },
      timeline: 'medium',
      priorities: {
        cost: 3,
        performance: 4,
        easeOfUse: 3,
        scalability: 4,
        vendorLockIn: 2,
      },
    };

    // Test with too few options
    const oneOption: TechnicalOption[] = [
      { name: 'AWS', category: 'cloud', metadata: {} },
    ];
    
    await expect(referee.compareOptions(oneOption, constraints))
      .rejects.toThrow('Must provide between 2 and 3 options');

    // Test with too many options
    const fourOptions: TechnicalOption[] = [
      { name: 'AWS', category: 'cloud', metadata: {} },
      { name: 'GCP', category: 'cloud', metadata: {} },
      { name: 'Azure', category: 'cloud', metadata: {} },
      { name: 'DigitalOcean', category: 'cloud', metadata: {} },
    ];
    
    await expect(referee.compareOptions(fourOptions, constraints))
      .rejects.toThrow('Must provide between 2 and 3 options');

    // Test with valid number of options
    const validOptions: TechnicalOption[] = [
      { name: 'AWS', category: 'cloud', metadata: {} },
      { name: 'GCP', category: 'cloud', metadata: {} },
    ];
    
    const result = await referee.compareOptions(validOptions, constraints);
    expect(result).toBeDefined();
    expect(result.options).toEqual(['AWS', 'GCP']);
  });
});