import { describe, expect, it } from 'vitest';
import { clampServings, roundGrams, scaleAmount } from '@/lib/servings';

describe('servings', () => {
  it('scales amounts by the number of people', () => {
    expect(scaleAmount(200, 2, 4)).toBe(400);
    expect(scaleAmount('300.00', 3, 1)).toBe(100);
    expect(scaleAmount(150, 2, 2)).toBe(150);
  });

  it('rounds grams the way people read them', () => {
    expect(roundGrams(66.666)).toBe(67);
    expect(roundGrams(2.345)).toBe(2.3);
  });

  it('keeps the count within 1..50', () => {
    expect(clampServings(0)).toBe(1);
    expect(clampServings(3.4)).toBe(3);
    expect(clampServings(99)).toBe(50);
    expect(clampServings(NaN)).toBe(1);
  });
});
