import { describe, expect, it } from 'vitest';
import { isInRange } from '../src/isInRange';

describe('isInRange', () => {
  it('should return true for strings with length within range', () => {
    expect(isInRange('hello', 3, 6)).toBe(true);
    expect(isInRange('hi', 2, 2)).toBe(true); // Exact length
    expect(isInRange('hello', 5, 10)).toBe(true); // Min boundary
    expect(isInRange('hello', 1, 5)).toBe(true); // Max boundary
    expect(isInRange('', 0, 5)).toBe(true); // Empty string
  });

  it('should return false for strings with length outside range', () => {
    expect(isInRange('hello', 6, 10)).toBe(false); // Too short
    expect(isInRange('hello world', 1, 5)).toBe(false); // Too long
    expect(isInRange('', 1, 5)).toBe(false); // Empty string when min > 0
  });

  it('should handle invalid inputs', () => {
    // @ts-expect-error Testing invalid input type
    expect(isInRange(123, 1, 5)).toBe(false);
    // @ts-expect-error Testing invalid input type
    expect(isInRange(null, 1, 5)).toBe(false);
    // @ts-expect-error Testing invalid input type
    expect(isInRange(undefined, 1, 5)).toBe(false);
  });

  it('should handle special characters and Unicode', () => {
    expect(isInRange('👋🌍', 2, 5)).toBe(true); // Emojis count as individual characters
    expect(isInRange('ñándú', 5, 10)).toBe(true); // Special characters
    expect(isInRange('你好', 2, 3)).toBe(true); // Chinese characters
  });
});
