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
 * Checks if a value is a string
 * @param value The value to check
 * @returns true if the value is a string, false otherwise
 */
declare function isString(value: unknown): value is string;

export { escape, isEmail, isInRange, isString };
