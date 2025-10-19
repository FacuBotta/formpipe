/**
 * Sanitizes HTML input by removing ALL HTML tags and scripts
 * Returns plain text only. Perfect for user inputs in frontend.
 *
 * @param value - The string to sanitize
 * @returns Plain text without any HTML
 *
 * @example
 * sanitize('<script>alert("XSS")</script>Hello') // "alert("XSS")Hello"
 * sanitize('<p><b>Bold</b></p>') // "Bold"
 */

export function sanitize(value: string): string {
  if (typeof value !== 'string') return '';

  // Remove script tags and their contents
  value = value.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove HTML tags but keep their contents
  value = value.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
