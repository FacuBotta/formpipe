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
export function isInRange(value: string, min: number, max: number): boolean {
  if (typeof value !== 'string') return false;
  const length = value.length;
  return length >= min && length <= max;
}
