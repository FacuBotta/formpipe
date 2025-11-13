/**
 * Validates whether a given string is a valid phone number according to the selected validation mode.
 *
 * This utility supports three validation modes:
 * - `'loose'`: Allows spaces, plus signs, parentheses, and hyphens. Requires at least 8 digits.
 * - `'strict'`: Accepts only digits (0–9), with a length between 8 and 15.
 * - `'e164'`: Follows the international E.164 format. Must start with an optional '+' and 8–15 digits,
 *   where the first digit (after '+', if present) cannot be 0.
 *
 * @param {string} value - The input string to validate.
 * @param {'loose' | 'strict' | 'e164'} [mode='e164'] - Validation mode (default: `'e164'`).
 * @returns {boolean} `true` if the phone number is valid according to the selected mode, otherwise `false`.
 *
 * @example
 * isPhone('+14155552671');           // true (E.164)
 * isPhone('1234567890', 'strict');   // true
 * isPhone('(123) 456-7890', 'loose');// true
 * isPhone('0000000');                // false
 */
export function isPhone(
  value: string,
  mode: 'loose' | 'strict' | 'e164' = 'e164'
): boolean {
  if (!value) return false;
  const normalized = value.trim();

  switch (mode) {
    case 'loose':
      // Allows spaces, '+', parentheses, and hyphens; requires at least 8 digits.
      return /^[\d\s()+-]{8,}$/.test(normalized);

    case 'strict':
      // Only digits; minimum 8 and maximum 15 characters.
      return /^\d{8,15}$/.test(normalized);

    case 'e164':
    default:
      // International E.164 format: optional '+', followed by 8–15 digits, cannot start with 0.
      return /^\+?[1-9]\d{7,14}$/.test(normalized);
  }
}
