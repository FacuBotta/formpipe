/**
 * Escapes HTML special characters in a string
 * @param value The string to escape
 * @returns The escaped string
 */
declare function escape(value: string): string;

declare const isEmail: (value: string) => boolean;

/**
 * Checks if a string's length is within a specified range (inclusive)
 * @param value The string to check
 * @param min The minimum length allowed
 * @param max The maximum length allowed
 * @returns true if the string length is within range, false otherwise
 * @example
 * isInRange("hello", 3, 6) // true
 * isInRange("hi", 3, 6) // false
 */
declare function isInRange(value: string, min: number, max: number): boolean;

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
declare function isPhone(value: string, mode?: 'loose' | 'strict' | 'e164'): boolean;

/**
 * Checks if a value is a string
 * @param value The value to check
 * @returns true if the value is a string, false otherwise
 */
declare function isString(value: unknown): value is string;

export { escape, isEmail, isInRange, isPhone, isString };
