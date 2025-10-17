/**
 * Checks if a number is within a specified range (inclusive)
 * @param value The number to check
 * @param min The minimum value of the range
 * @param max The maximum value of the range
 * @returns true if the value is within range, false otherwise
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
