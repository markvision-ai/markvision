
import { describe, it, expect } from 'vitest';

// Helper function to calculate percentage (extracted logic from DataTable)
const calculatePercentage = (fact: number, plan: number): number => {
  if (plan <= 0) return 0;
  return (fact / plan) * 100;
};

describe('Percentage Calculation Logic', () => {
  it('should calculate percentage correctly for normal values', () => {
    expect(calculatePercentage(50, 100)).toBe(50);
    expect(calculatePercentage(120, 100)).toBe(120);
    expect(calculatePercentage(0, 100)).toBe(0);
  });

  it('should handle zero plan value (avoid division by zero)', () => {
    expect(calculatePercentage(50, 0)).toBe(0);
    expect(calculatePercentage(0, 0)).toBe(0);
  });

  it('should handle negative values (though unlikely for subscribers)', () => {
    expect(calculatePercentage(-10, 100)).toBe(-10);
  });

  it('should handle decimal values', () => {
    expect(calculatePercentage(33.33, 100)).toBeCloseTo(33.33);
  });
  
  it('should handle large numbers', () => {
    expect(calculatePercentage(1000000, 2000000)).toBe(50);
  });
});
