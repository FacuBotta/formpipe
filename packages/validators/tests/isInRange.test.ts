import { describe, expect, it } from 'vitest';
import { isInRange } from '../src/isInRange';

describe('isInRange', () => {
  it('should return true for numbers within range', () => {
    expect(isInRange(5, 0, 10)).toBe(true);
    expect(isInRange(0, 0, 10)).toBe(true); // Min boundary
    expect(isInRange(10, 0, 10)).toBe(true); // Max boundary
    expect(isInRange(5.5, 5, 6)).toBe(true); // Decimal numbers
  });

  it('should return false for numbers outside range', () => {
    expect(isInRange(-1, 0, 10)).toBe(false);
    expect(isInRange(11, 0, 10)).toBe(false);
    expect(isInRange(4.9, 5, 6)).toBe(false);
  });
});
