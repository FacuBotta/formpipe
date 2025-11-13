import { describe, expect, it } from 'vitest';
import { isPhone } from '../src/isPhone';

describe('isPhone', () => {
  //
  // 🧩 MODE: e164 (default)
  //
  describe('mode: e164 (default)', () => {
    it('should validate proper E.164 numbers', () => {
      expect(isPhone('+14155552671')).toBe(true); // US
      expect(isPhone('34911223344')).toBe(true); // Spain (no +)
      expect(isPhone('+447911123456')).toBe(true); // UK
    });

    it('should reject numbers that are too short or too long', () => {
      expect(isPhone('+1234567')).toBe(false); // 7 digits (too short)
      expect(isPhone('+1234567890123456')).toBe(false); // 16 digits (too long)
    });

    it('should reject numbers starting with 0', () => {
      expect(isPhone('+0012345678')).toBe(false);
      expect(isPhone('00000000')).toBe(false);
    });

    it('should reject non-numeric characters', () => {
      expect(isPhone('+34abc123456')).toBe(false);
      expect(isPhone('+34-123-456')).toBe(false);
      expect(isPhone('(123)456')).toBe(false);
    });

    it('should reject empty and whitespace-only strings', () => {
      expect(isPhone('')).toBe(false);
      expect(isPhone('   ')).toBe(false);
    });
  });

  //
  // 🧩 MODE: strict
  //
  describe('mode: strict', () => {
    it('should accept only digits between 8 and 15 chars', () => {
      expect(isPhone('12345678', 'strict')).toBe(true);
      expect(isPhone('123456789012345', 'strict')).toBe(true);
    });

    it('should reject digits shorter than 8 or longer than 15', () => {
      expect(isPhone('1234567', 'strict')).toBe(false);
      expect(isPhone('1234567890123456', 'strict')).toBe(false);
    });

    it('should reject strings with +, spaces, or symbols', () => {
      expect(isPhone('+1234567890', 'strict')).toBe(false);
      expect(isPhone('123 456 789', 'strict')).toBe(false);
      expect(isPhone('123-456-789', 'strict')).toBe(false);
    });
  });

  //
  // 🧩 MODE: loose
  //
  describe('mode: loose', () => {
    it('should accept numbers with spaces, parentheses, +, or hyphens', () => {
      expect(isPhone('+34 600 123 456', 'loose')).toBe(true);
      expect(isPhone('(123) 456-7890', 'loose')).toBe(true);
      expect(isPhone('123 456 7890', 'loose')).toBe(true);
    });

    it('should reject strings that are too short or contain letters', () => {
      expect(isPhone('1234567', 'loose')).toBe(false);
      expect(isPhone('abc 123 456', 'loose')).toBe(false);
    });

    it('should accept long numbers with formatting characters', () => {
      expect(isPhone('+1 (234) 567-8901', 'loose')).toBe(true);
    });
  });

  //
  // 🧩 GENERAL EDGE CASES
  //
  describe('edge cases', () => {
    it('should trim whitespace before validating', () => {
      expect(isPhone('   +14155552671   ')).toBe(true);
    });

    it('should handle nullish or undefined safely', () => {
      // @ts-expect-error – responds to null
      expect(isPhone(null)).toBe(false);
      // @ts-expect-error - responds to undefined
      expect(isPhone(undefined)).toBe(false);
    });
  });
});
